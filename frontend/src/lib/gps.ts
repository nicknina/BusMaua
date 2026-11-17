import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import { distanciaMetros, type Ponto } from "./geo";
import type { Parada, Viagem } from "./tipos";

const INTERVALO_ENVIO_MS = 4000;
const SIMULAR = import.meta.env.VITE_SIMULAR_GPS === "true";
const VELOCIDADE_SIMULADA_KMH = 35;

export interface EstadoGps {
  posicao: Ponto | null;
  velocidadeKmh: number | null;
  erro: string | null;
  simulado: boolean;
}

/**
 * Enquanto a viagem estiver EM_ANDAMENTO, lê o GPS do celular do motorista e envia a
 * posição ao servidor (no máximo a cada 4 s). Mantém a tela ligada com a Wake Lock API,
 * porque navegadores não enviam localização com o app em segundo plano.
 */
export function useEnvioGps(viagem: Viagem | null | undefined, rota: Parada[] | null, aoAtualizar: (v: Viagem) => void): EstadoGps {
  const [posicao, setPosicao] = useState<Ponto | null>(null);
  const [velocidadeKmh, setVelocidade] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const ultimoEnvio = useRef(0);
  const anterior = useRef<{ ponto: Ponto; t: number } | null>(null);
  const aoAtualizarRef = useRef(aoAtualizar);
  aoAtualizarRef.current = aoAtualizar;

  const viagemId = viagem?.id;
  const ativo = viagem?.status === "EM_ANDAMENTO";
  const temRota = !!rota && rota.length > 1;

  useEffect(() => {
    if (!ativo || !viagemId) return;
    let cancelado = false;

    const registrar = (ponto: Ponto, kmhInformado: number | null) => {
      const agora = Date.now();
      let kmh = kmhInformado;
      if (kmh == null && anterior.current) {
        const segundos = (agora - anterior.current.t) / 1000;
        if (segundos > 0) kmh = (distanciaMetros(anterior.current.ponto, ponto) / segundos) * 3.6;
      }
      anterior.current = { ponto, t: agora };
      setPosicao(ponto);
      setVelocidade(kmh != null ? Math.round(kmh) : null);

      if (agora - ultimoEnvio.current < INTERVALO_ENVIO_MS) return;
      ultimoEnvio.current = agora;
      api
        .post<Viagem>(`/motorista/viagens/${viagemId}/localizacao`, {
          latitude: ponto.lat,
          longitude: ponto.lng,
          velocidadeKmh: kmh != null ? Math.max(0, kmh) : null,
        })
        .then((v) => {
          if (!cancelado) {
            setErro(null);
            aoAtualizarRef.current(v);
          }
        })
        .catch((e: Error) => !cancelado && setErro(e.message));
    };

    // mantém a tela acesa durante a viagem
    let trava: WakeLockSentinel | null = null;
    const pedirTrava = () => {
      if ("wakeLock" in navigator && document.visibilityState === "visible") {
        navigator.wakeLock
          .request("screen")
          .then((t) => (trava = t))
          .catch(() => undefined);
      }
    };
    pedirTrava();
    document.addEventListener("visibilitychange", pedirTrava);

    let pararLeitura: () => void;
    if (SIMULAR && temRota && rota) {
      pararLeitura = simularTrajeto(rota, registrar);
    } else if ("geolocation" in navigator) {
      const id = navigator.geolocation.watchPosition(
        (p) =>
          registrar(
            { lat: p.coords.latitude, lng: p.coords.longitude },
            p.coords.speed != null ? p.coords.speed * 3.6 : null,
          ),
        (e) =>
          setErro(
            e.code === e.PERMISSION_DENIED
              ? "Permita o acesso à localização para os alunos verem o veículo no mapa."
              : "Não foi possível obter o GPS. Verifique se a localização do celular está ligada.",
          ),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 },
      );
      pararLeitura = () => navigator.geolocation.clearWatch(id);
    } else {
      setErro("Este aparelho não oferece localização por GPS.");
      pararLeitura = () => undefined;
    }

    return () => {
      cancelado = true;
      pararLeitura();
      document.removeEventListener("visibilitychange", pedirTrava);
      trava?.release().catch(() => undefined);
    };
    // a rota só é usada na simulação; depender de temRota evita reiniciar a leitura a cada render
  }, [ativo, viagemId, temRota]);

  return { posicao, velocidadeKmh, erro, simulado: SIMULAR };
}

/** Percorre as paradas da linha a velocidade constante (modo de apresentação). */
function simularTrajeto(rota: Parada[], registrar: (p: Ponto, kmh: number) => void): () => void {
  const pontos = rota.map((p) => ({ lat: p.latitude, lng: p.longitude }));
  const trechos = pontos.slice(1).map((p, i) => distanciaMetros(pontos[i], p));
  const total = trechos.reduce((a, b) => a + b, 0);
  const metrosPorSegundo = VELOCIDADE_SIMULADA_KMH / 3.6;
  const inicio = Date.now();

  const passo = () => {
    let percorrido = Math.min(total, ((Date.now() - inicio) / 1000) * metrosPorSegundo);
    let i = 0;
    while (i < trechos.length - 1 && percorrido > trechos[i]) {
      percorrido -= trechos[i];
      i++;
    }
    const f = trechos[i] > 0 ? Math.min(1, percorrido / trechos[i]) : 1;
    const a = pontos[i];
    const b = pontos[i + 1];
    registrar({ lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f }, VELOCIDADE_SIMULADA_KMH);
  };
  passo();
  const id = window.setInterval(passo, 1000);
  return () => window.clearInterval(id);
}
