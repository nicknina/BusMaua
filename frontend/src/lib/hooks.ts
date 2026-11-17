import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import { useAuth } from "./auth";
import type { Ponto } from "./geo";
import { preferencias } from "./sessao";
import { assinar } from "./tempoReal";
import type { FilaStatus, Linha, Notificacao, Viagem } from "./tipos";

/** Executa `acao` a cada `ms` milissegundos enquanto a tela estiver aberta. */
export function useIntervalo(acao: () => void, ms: number | null) {
  const ref = useRef(acao);
  ref.current = acao;
  useEffect(() => {
    if (ms === null) return;
    const id = window.setInterval(() => ref.current(), ms);
    return () => window.clearInterval(id);
  }, [ms]);
}

/** Força um re-render periódico (para contagens regressivas e "há X min"). */
export function useRelogio(ms = 1000): number {
  const [agora, setAgora] = useState(() => Date.now());
  useIntervalo(() => setAgora(Date.now()), ms);
  return agora;
}

let cacheLinhas: Linha[] | null = null;

/** Linhas, paradas e horários (mudam pouco: ficam em cache durante a sessão). */
export function useLinhas() {
  const [linhas, setLinhas] = useState<Linha[] | null>(cacheLinhas);
  const [erro, setErro] = useState<string | null>(null);
  useEffect(() => {
    if (cacheLinhas) return;
    api
      .get<Linha[]>("/linhas")
      .then((dados) => {
        cacheLinhas = dados;
        setLinhas(dados);
      })
      .catch((e: Error) => setErro(e.message));
  }, []);
  return { linhas, erro };
}

/**
 * Saídas de hoje (agendadas e em curso), atualizadas ao vivo pelo tópico /topic/frota.
 * O polling a cada 30 s cobre quedas momentâneas do WebSocket.
 */
export function useViagensHoje() {
  const [viagens, setViagens] = useState<Viagem[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(() => {
    api
      .get<Viagem[]>("/viagens/proximas")
      .then((dados) => {
        setViagens(dados);
        setErro(null);
      })
      .catch((e: Error) => setErro(e.message));
  }, []);

  useEffect(() => {
    carregar();
    return assinar<Viagem>("/topic/frota", (atualizada) => {
      setViagens((atual) => {
        if (!atual) return atual;
        if (atualizada.status === "ENCERRADA") return atual.filter((v) => v.id !== atualizada.id);
        const existe = atual.some((v) => v.id === atualizada.id);
        return existe ? atual.map((v) => (v.id === atualizada.id ? atualizada : v)) : [...atual, atualizada];
      });
    });
  }, [carregar]);

  useIntervalo(carregar, 30_000);
  return { viagens, erro, recarregar: carregar };
}

/** Situação do aluno na fila virtual (null = não está em nenhuma fila). */
export function useMinhaFila() {
  const { usuario } = useAuth();
  const [fila, setFila] = useState<FilaStatus | null | undefined>(undefined);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(() => {
    api
      .get<FilaStatus | null>("/fila/minha")
      .then((dados) => {
        setFila(dados);
        setErro(null);
      })
      .catch((e: Error) => setErro(e.message));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const viagemId = fila?.viagem.id;
  useEffect(() => {
    if (!viagemId) return;
    const cancelarFila = assinar(`/topic/viagens/${viagemId}/fila`, carregar);
    const cancelarFrota = assinar<Viagem>("/topic/frota", (v) => {
      if (v.id === viagemId) carregar();
    });
    return () => {
      cancelarFila();
      cancelarFrota();
    };
  }, [viagemId, carregar]);

  // "Sua vez", "embarque confirmado" e "saiu da fila" chegam como notificação pessoal
  useEffect(
    () =>
      assinar<{ usuarioId: number | null }>("/topic/notificacoes", (evento) => {
        if (evento.usuarioId === usuario?.id) carregar();
      }),
    [usuario?.id, carregar],
  );

  useIntervalo(carregar, 20_000);
  return { fila, setFila, erro, recarregar: carregar };
}

function chaveVisto(usuarioId: number | undefined) {
  return `notificacoes-vistas-${usuarioId ?? "anon"}`;
}

/** Notificações do usuário + avisos gerais, com contagem de não lidas. */
export function useNotificacoes() {
  const { usuario } = useAuth();
  const [lista, setLista] = useState<Notificacao[] | null>(null);
  const [vistoAte, setVistoAte] = useState<number>(() => Number(preferencias.ler(chaveVisto(usuario?.id)) ?? 0));

  const carregar = useCallback(() => {
    api
      .get<Notificacao[]>("/notificacoes")
      .then(setLista)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(
    () =>
      assinar<{ usuarioId: number | null }>("/topic/notificacoes", (evento) => {
        if (evento.usuarioId === null || evento.usuarioId === usuario?.id) carregar();
      }),
    [usuario?.id, carregar],
  );

  useIntervalo(carregar, 60_000);

  const naoLidas = (lista ?? []).filter((n) => new Date(n.criadaEm).getTime() > vistoAte).length;

  const marcarComoVistas = useCallback(() => {
    const agora = Date.now();
    preferencias.gravar(chaveVisto(usuario?.id), String(agora));
    setVistoAte(agora);
  }, [usuario?.id]);

  return { lista, naoLidas, vistoAte, marcarComoVistas };
}

/** Posição atual do aparelho (para "Você" no mapa e para sugerir o ponto mais próximo). */
export function useMinhaPosicao(ativo = true) {
  const [posicao, setPosicao] = useState<Ponto | null>(null);
  const [negado, setNegado] = useState(false);
  useEffect(() => {
    if (!ativo || !("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setPosicao({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => setNegado(e.code === e.PERMISSION_DENIED),
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [ativo]);
  return { posicao, negado };
}
