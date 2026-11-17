import {
  AlertTriangle,
  Bus,
  Check,
  ChevronDown,
  Clock,
  Map as IconeMapa,
  Pause,
  Play,
  Radio,
  Square,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Mapa } from "../../components/Mapa";
import {
  Alerta,
  Botao,
  CabecalhoMotorista,
  Carregando,
  Cartao,
  classes,
  Indicador,
  Interruptor,
} from "../../components/ui";
import { api, mensagemDeErro } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { minutosAgora, minutosDoDia, primeiroNome } from "../../lib/formato";
import { distanciaMetros, minutosAte, pontoDaParada, type Ponto } from "../../lib/geo";
import type { Linha, Parada, Veiculo, Viagem as TipoViagem } from "../../lib/tipos";
import { useMotorista } from "./LayoutMotorista";

export function Viagem() {
  const { viagem } = useMotorista();
  if (viagem === undefined) return <Carregando />;
  return viagem ? <ViagemEmAndamento viagem={viagem} /> : <InicioViagem />;
}

// ------------------------------------------------------------------ início da viagem

function proximoHorario(linha: Linha) {
  const agora = minutosAgora();
  return linha.horarios.find((h) => minutosDoDia(h.horaSaida) >= agora - 15) ?? linha.horarios[0] ?? null;
}

function InicioViagem() {
  const { usuario } = useAuth();
  const { linhas, definirViagem } = useMotorista();
  const [veiculos, setVeiculos] = useState<Veiculo[] | null>(null);
  const [linhaId, setLinhaId] = useState<number | null>(null);
  const [horarioId, setHorarioId] = useState<number | null>(null);
  const [veiculoId, setVeiculoId] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api.get<Veiculo[]>("/veiculos").then(setVeiculos).catch((e: Error) => setErro(e.message));
  }, []);

  // sugere a linha com a saída mais próxima de agora
  const linhaSugerida = useMemo(() => {
    if (!linhas?.length) return null;
    const agora = minutosAgora();
    const distancia = (l: Linha) => {
      const h = proximoHorario(l);
      if (!h) return Infinity;
      const d = minutosDoDia(h.horaSaida) - agora;
      return d < -15 ? d + 24 * 60 : d;
    };
    return [...linhas].sort((a, b) => distancia(a) - distancia(b))[0];
  }, [linhas]);

  const linha = linhas?.find((l) => l.id === linhaId) ?? linhaSugerida;
  const horario = linha?.horarios.find((h) => h.id === horarioId) ?? (linha ? proximoHorario(linha) : null);
  const veiculo = veiculos?.find((v) => v.id === veiculoId) ?? veiculos?.find((v) => v.id === horario?.veiculo?.id) ?? veiculos?.[0];

  const checagens = useChecagens();

  async function iniciar() {
    if (!veiculo || !horario) return;
    setErro(null);
    setEnviando(true);
    try {
      definirViagem(await api.post<TipoViagem>("/motorista/viagens/iniciar", { veiculoId: veiculo.id, horarioId: horario.id }));
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <CabecalhoMotorista
        titulo={`Olá, ${usuario ? primeiroNome(usuario.nome) : ""}`}
        subtitulo="Pronto para a próxima saída?"
      />
      <div className="flex flex-col gap-4 px-4 pt-4">
        {!linhas || !veiculos ? (
          erro ? <Alerta tipo="erro">{erro}</Alerta> : <Carregando />
        ) : (
          <>
            <Cartao className="flex flex-col gap-3">
              <Seletor
                rotulo="Veículo"
                icone={<Bus className="h-5 w-5" />}
                valor={veiculo?.id ?? ""}
                aoMudar={(v) => setVeiculoId(v)}
                opcoes={veiculos.map((v) => ({ valor: v.id, texto: `${v.nome} · ${v.placa}` }))}
              />
              <Seletor
                rotulo="Linha"
                icone={<IconeMapa className="h-5 w-5" />}
                valor={linha?.id ?? ""}
                aoMudar={(v) => {
                  setLinhaId(v);
                  setHorarioId(null);
                  setVeiculoId(null);
                }}
                opcoes={linhas.map((l) => ({ valor: l.id, texto: l.nome }))}
              />
              <Seletor
                rotulo="Horário de saída"
                icone={<Clock className="h-5 w-5" />}
                valor={horario?.id ?? ""}
                aoMudar={(v) => {
                  setHorarioId(v);
                  setVeiculoId(null);
                }}
                opcoes={(linha?.horarios ?? []).map((h) => ({
                  valor: h.id,
                  texto: [h.horaSaida, h.localSaida].filter(Boolean).join(" · "),
                }))}
              />
            </Cartao>

            <Cartao>
              <h2 className="mb-3 font-semibold">Antes de iniciar</h2>
              <ul className="flex flex-col gap-3">
                <ItemChecagem ok={checagens.gps === "ok"} acao={checagens.gps === "pedir" ? { texto: "Permitir", aoClicar: checagens.pedirGps } : undefined}>
                  {checagens.gps === "negado" ? "Localização bloqueada: libere nas configurações do navegador" : "GPS do aparelho ativo"}
                </ItemChecagem>
                <ItemChecagem ok={checagens.online}>
                  {checagens.online ? "Internet conectada" : "Sem internet"}
                </ItemChecagem>
                <ItemChecagem ok={checagens.telaLigada}>
                  {checagens.telaLigada ? "Tela ficará ligada durante a viagem" : "Mantenha o app aberto durante a viagem"}
                </ItemChecagem>
              </ul>
            </Cartao>

            {erro && <Alerta tipo="erro">{erro}</Alerta>}

            <Botao
              variante="sucesso"
              icone={<Radio className="h-6 w-6" />}
              carregando={enviando}
              disabled={!veiculo || !horario}
              onClick={iniciar}
              className="mt-2"
            >
              Iniciar viagem
            </Botao>
            <p className="-mt-2 flex items-center justify-center gap-2 text-sm text-cinza">
              <Users className="h-4 w-4" /> Os alunos da linha verão sua posição ao vivo
            </p>
          </>
        )}
      </div>
    </>
  );
}

function Seletor({
  rotulo,
  icone,
  valor,
  opcoes,
  aoMudar,
}: {
  rotulo: string;
  icone: ReactNode;
  valor: number | "";
  opcoes: { valor: number; texto: string }[];
  aoMudar: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-cinza">{rotulo}</span>
      <span className="relative flex h-14 items-center gap-3 rounded-2xl bg-fundo px-4 text-azul">
        {icone}
        <span className="min-w-0 flex-1 truncate font-semibold text-tinta">
          {opcoes.find((o) => o.valor === valor)?.texto ?? "Selecione"}
        </span>
        <ChevronDown className="h-5 w-5 text-cinza" />
        <select
          aria-label={rotulo}
          value={valor}
          onChange={(e) => aoMudar(Number(e.target.value))}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.texto}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

function ItemChecagem({ ok, children, acao }: { ok: boolean; children: ReactNode; acao?: { texto: string; aoClicar: () => void } }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={classes(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          ok ? "bg-verde-claro text-verde" : "bg-ambar-claro text-ambar-escuro",
        )}
      >
        {ok ? <Check className="h-4 w-4" strokeWidth={3} /> : <AlertTriangle className="h-4 w-4" />}
      </span>
      <span className="flex-1 text-sm">{children}</span>
      {acao && (
        <button type="button" onClick={acao.aoClicar} className="text-sm font-semibold text-azul">
          {acao.texto}
        </button>
      )}
    </li>
  );
}

function useChecagens() {
  const [gps, setGps] = useState<"ok" | "pedir" | "negado">("pedir");
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const atualizar = () => setOnline(navigator.onLine);
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGps("negado");
      return;
    }
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((estado) => {
        const aplicar = () => setGps(estado.state === "granted" ? "ok" : estado.state === "denied" ? "negado" : "pedir");
        aplicar();
        estado.onchange = aplicar;
      })
      .catch(() => undefined);
  }, []);

  const pedirGps = () =>
    navigator.geolocation.getCurrentPosition(
      () => setGps("ok"),
      (e) => setGps(e.code === e.PERMISSION_DENIED ? "negado" : "pedir"),
      { enableHighAccuracy: true, timeout: 15000 },
    );

  return { gps, online, telaLigada: "wakeLock" in navigator, pedirGps };
}

// ------------------------------------------------------------------ viagem em andamento

/** Próxima parada: a mais próxima, ou a seguinte se o veículo já passou por ela. */
function proximaParada(rota: Parada[], posicao: Ponto | null): Parada | null {
  if (!posicao || rota.length === 0) return rota[0] ?? null;
  let indice = 0;
  rota.forEach((p, i) => {
    if (distanciaMetros(posicao, pontoDaParada(p)) < distanciaMetros(posicao, pontoDaParada(rota[indice]))) indice = i;
  });
  const ultima = rota.length - 1;
  if (indice < ultima) {
    const atual = pontoDaParada(rota[indice]);
    const seguinte = pontoDaParada(rota[indice + 1]);
    const jaPassou = distanciaMetros(posicao, seguinte) < distanciaMetros(atual, seguinte);
    const chegou = distanciaMetros(posicao, atual) < 120;
    if (jaPassou || chegou) indice++;
  }
  return rota[indice];
}

function ViagemEmAndamento({ viagem }: { viagem: TipoViagem }) {
  const { definirViagem, rota, gps } = useMotorista();
  const [acao, setAcao] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [painelAtraso, setPainelAtraso] = useState(false);
  const [confirmarFim, setConfirmarFim] = useState(false);

  const compartilhando = viagem.status === "EM_ANDAMENTO";
  const posicao =
    gps.posicao ?? (viagem.latitude != null && viagem.longitude != null ? { lat: viagem.latitude, lng: viagem.longitude } : null);
  const proxima = rota ? proximaParada(rota, posicao) : null;
  const minutosProxima = proxima && posicao ? minutosAte(posicao, pontoDaParada(proxima), gps.velocidadeKmh) : null;
  const velocidade = gps.velocidadeKmh ?? (viagem.velocidadeKmh != null ? Math.round(viagem.velocidadeKmh) : null);

  async function executar(nome: string, caminho: string, corpo: unknown = {}) {
    setErro(null);
    setAcao(nome);
    try {
      const atualizada = await api.post<TipoViagem>(`/motorista/viagens/${viagem.id}/${caminho}`, corpo);
      definirViagem(atualizada.status === "ENCERRADA" ? null : atualizada);
      return true;
    } catch (e) {
      setErro(mensagemDeErro(e));
      return false;
    } finally {
      setAcao(null);
    }
  }

  return (
    <>
      <CabecalhoMotorista
        selo={false}
        titulo="Viagem em andamento"
        subtitulo={`${viagem.veiculo?.nome ?? "Veículo"} · ${viagem.linha}`}
        direita={
          <Interruptor
            rotulo="Compartilhar localização"
            ligado={compartilhando}
            desabilitado={acao !== null}
            aoMudar={(ligar) => executar(ligar ? "retomar" : "pausar", ligar ? "retomar" : "pausar")}
          />
        }
      />

      <div
        className={classes(
          "-mt-4 flex items-center justify-between gap-2 px-5 pb-3 pt-7",
          gps.erro ? "bg-vermelho-claro text-vermelho" : compartilhando ? "bg-verde-claro text-verde" : "bg-ambar-claro text-ambar-escuro",
        )}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className={classes("h-2.5 w-2.5 rounded-full", gps.erro ? "bg-vermelho" : compartilhando ? "bg-verde" : "bg-ambar")} />
          {gps.erro ?? (compartilhando ? "Compartilhando localização ao vivo" : "Compartilhamento pausado")}
          {gps.simulado && compartilhando && !gps.erro && " (simulação)"}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-semibold text-verde">
          <Users className="h-4 w-4" /> {viagem.naFila} na fila
        </span>
      </div>

      <Mapa className="h-[300px]" rota={rota} voce={posicao ? { ponto: posicao, estilo: "motorista" } : null} seguirVoce />

      <div className="flex flex-col gap-3 px-4 pt-4">
        <div className="flex gap-2">
          <Indicador
            rotulo={minutosProxima != null ? `Próx. parada · ${minutosProxima} min` : "Próx. parada"}
            valor={<span className="text-lg">{proxima?.nome ?? "—"}</span>}
          />
          <Indicador rotulo="Velocidade" valor={velocidade ?? "—"} sufixo="km/h" />
          <Indicador rotulo="Lotação" valor={`${viagem.lotacao}/${viagem.capacidade}`} />
        </div>

        <div className="flex gap-3">
          <Botao
            variante="contorno"
            tamanho="medio"
            icone={compartilhando ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            carregando={acao === "pausar" || acao === "retomar"}
            disabled={acao !== null}
            onClick={() => executar(compartilhando ? "pausar" : "retomar", compartilhando ? "pausar" : "retomar")}
          >
            {compartilhando ? "Pausar" : "Retomar"}
          </Botao>
          <Botao
            variante="aviso"
            tamanho="medio"
            icone={<AlertTriangle className="h-5 w-5" />}
            disabled={acao !== null}
            onClick={() => setPainelAtraso((v) => !v)}
          >
            Informar atraso
          </Botao>
        </div>

        {painelAtraso && (
          <PainelAtraso
            enviando={acao === "atraso"}
            aoFechar={() => setPainelAtraso(false)}
            aoEnviar={async (minutos, motivo) => {
              if (await executar("atraso", "atraso", { minutos, motivo })) setPainelAtraso(false);
            }}
          />
        )}

        {viagem.atrasoMinutos > 0 && !painelAtraso && (
          <Alerta tipo="aviso">
            Atraso informado: {viagem.atrasoMinutos} min{viagem.motivoAtraso ? ` · ${viagem.motivoAtraso}` : ""}. Os
            alunos foram avisados.
          </Alerta>
        )}

        {erro && <Alerta tipo="erro">{erro}</Alerta>}

        <Botao
          variante="perigo"
          icone={<Square className="h-5 w-5" />}
          carregando={acao === "encerrar"}
          disabled={acao !== null}
          onClick={() => {
            if (confirmarFim) executar("encerrar", "encerrar");
            else setConfirmarFim(true);
          }}
          className="mt-3"
        >
          {confirmarFim ? "Toque de novo para encerrar" : "Encerrar viagem"}
        </Botao>
        {confirmarFim && (
          <button type="button" onClick={() => setConfirmarFim(false)} className="-mt-1 text-sm font-semibold text-cinza">
            Cancelar
          </button>
        )}
      </div>
    </>
  );
}

function PainelAtraso({
  enviando,
  aoEnviar,
  aoFechar,
}: {
  enviando: boolean;
  aoEnviar: (minutos: number, motivo: string) => void;
  aoFechar: () => void;
}) {
  const [minutos, setMinutos] = useState(5);
  const [motivo, setMotivo] = useState("");
  return (
    <Cartao className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Quanto tempo de atraso?</h2>
        <button type="button" aria-label="Fechar" onClick={aoFechar}>
          <X className="h-5 w-5 text-cinza" />
        </button>
      </div>
      <div className="flex gap-2">
        {[5, 10, 15, 20].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMinutos(m)}
            className={classes(
              "flex-1 rounded-full py-2 font-semibold",
              minutos === m ? "bg-ambar text-white" : "bg-ambar-claro text-ambar-escuro",
            )}
          >
            {m} min
          </button>
        ))}
      </div>
      <input
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        maxLength={200}
        placeholder="Motivo (ex.: trânsito na Av. Goiás)"
        className="h-12 rounded-2xl border border-cinza-linha bg-fundo px-4 outline-none focus:border-azul"
      />
      <Botao tamanho="medio" carregando={enviando} onClick={() => aoEnviar(minutos, motivo.trim())}>
        Avisar os alunos
      </Botao>
    </Cartao>
  );
}
