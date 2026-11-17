import { AlertTriangle, Bus, Check, CheckCircle2, Clock, MapPin, Users } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Alerta, BarraProgresso, Botao, CabecalhoTela, Carregando, Cartao, classes, Vazio } from "../../components/ui";
import { api, mensagemDeErro } from "../../lib/api";
import { corLotacao } from "../../lib/formato";
import { paradaMaisProxima } from "../../lib/geo";
import { useLinhas, useMinhaFila, useMinhaPosicao, useRelogio, useViagensHoje } from "../../lib/hooks";
import type { FilaStatus, Viagem } from "../../lib/tipos";

const MINUTOS_PARA_EMBARCAR = 5;

export function FilaVirtual() {
  const { fila, setFila, erro, recarregar } = useMinhaFila();
  const { viagens } = useViagensHoje();

  if (fila === undefined) {
    return (
      <>
        <CabecalhoTela titulo="Fila virtual" />
        {erro ? <div className="px-4"><Alerta tipo="erro">{erro}</Alerta></div> : <Carregando />}
      </>
    );
  }

  if (fila === null) {
    return <EscolherSaida viagens={viagens} aoEntrar={setFila} />;
  }

  return <MinhaFila fila={fila} viagens={viagens ?? []} aoMudar={setFila} recarregar={recarregar} />;
}

// ------------------------------------------------------------------ aluno na fila

function MinhaFila({
  fila,
  viagens,
  aoMudar,
  recarregar,
}: {
  fila: FilaStatus;
  viagens: Viagem[];
  aoMudar: (f: FilaStatus | null) => void;
  recarregar: () => void;
}) {
  const navegar = useNavigate();
  const [acao, setAcao] = useState<"embarque" | "sair" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const v = fila.viagem;
  const nomeVeiculo = v.veiculo?.nome ?? "Veículo";
  const emRota = v.status === "EM_ANDAMENTO" || v.status === "PAUSADA";

  async function confirmarEmbarque() {
    setErro(null);
    setAcao("embarque");
    try {
      aoMudar(await api.post<FilaStatus>("/fila/minha/embarque"));
    } catch (e) {
      setErro(mensagemDeErro(e));
      recarregar();
    } finally {
      setAcao(null);
    }
  }

  async function sair() {
    setErro(null);
    setAcao("sair");
    try {
      await api.delete("/fila/minha");
      aoMudar(null);
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setAcao(null);
    }
  }

  const proximas = viagens.filter((x) => x.status !== "ENCERRADA").slice(0, 3);

  return (
    <>
      <CabecalhoTela titulo="Fila virtual" subtitulo={`${nomeVeiculo} · saída ${v.horaSaida}`} />
      <div className="flex flex-col gap-4 px-4">
        {fila.status === "EMBARCADO" ? (
          <section className="flex flex-col items-center rounded-4xl bg-verde px-6 py-8 text-center text-white">
            <CheckCircle2 className="h-16 w-16" strokeWidth={1.6} />
            <h2 className="mt-3 text-2xl font-bold">Embarque confirmado</h2>
            <p className="mt-1 text-white/90">Boa viagem no {nomeVeiculo}!</p>
          </section>
        ) : fila.status === "CHAMADO" ? (
          <CartaoChamado fila={fila} />
        ) : (
          <section className="flex flex-col items-center rounded-4xl bg-azul px-6 py-7 text-center text-white">
            <span className="text-sm font-medium tracking-[0.2em] text-azul-medio">SUA POSIÇÃO</span>
            <span className="text-7xl font-bold leading-none">{fila.posicao ?? "-"}º</span>
            <span className="mt-3 text-lg">
              {fila.alunosAFrente === 0
                ? "Você é o próximo"
                : `${fila.alunosAFrente} ${fila.alunosAFrente === 1 ? "aluno" : "alunos"} à sua frente`}
            </span>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {emRota ? (
                <>
                  <ChipBranco icone={<MapPin className="h-4 w-4" />}>{fila.parada}</ChipBranco>
                  <ChipBranco icone={<Bus className="h-4 w-4" />}>
                    {fila.minutosAteVeiculo != null ? `${nomeVeiculo} a ${fila.minutosAteVeiculo} min` : nomeVeiculo}
                  </ChipBranco>
                </>
              ) : (
                <>
                  <ChipBranco icone={<Clock className="h-4 w-4" />}>
                    Espera ~{fila.minutosAteVeiculo ?? "?"} min
                  </ChipBranco>
                  <ChipBranco icone={<Bus className="h-4 w-4" />}>Saída às {v.horaSaida}</ChipBranco>
                </>
              )}
            </div>
          </section>
        )}

        <Cartao>
          <div className="flex items-center justify-between font-semibold">
            <span>Ocupação do veículo</span>
            <span className="text-azul">
              {v.lotacao} / {v.capacidade} lugares
            </span>
          </div>
          <BarraProgresso valor={v.lotacao} maximo={v.capacidade} className="mt-3" />
        </Cartao>

        {fila.status === "AGUARDANDO" && !fila.cabeNoVeiculo && (
          <Alerta tipo="aviso" icone={<AlertTriangle className="h-5 w-5 text-ambar-escuro" />}>
            Pela lotação atual, talvez não haja lugar para a sua posição. Fique de olho na próxima saída.
          </Alerta>
        )}

        {fila.status !== "EMBARCADO" && (
          <Alerta tipo="aviso" icone={<AlertTriangle className="h-5 w-5 text-ambar-escuro" />}>
            Quando for sua vez, você terá {MINUTOS_PARA_EMBARCAR} min para chegar ao ponto. Depois disso, sai da fila
            automaticamente.
          </Alerta>
        )}

        {proximas.length > 0 && (
          <div>
            <h3 className="mb-2 text-lg font-semibold">Próximas saídas</h3>
            <div className="flex flex-col gap-2">
              {proximas.map((p) => (
                <LinhaSaida key={p.id} viagem={p} atual={p.id === v.id} />
              ))}
            </div>
          </div>
        )}

        {erro && <Alerta tipo="erro">{erro}</Alerta>}

        {fila.status === "EMBARCADO" ? (
          <Botao onClick={() => navegar("/aluno/mapa")} icone={<MapPin className="h-5 w-5" />}>
            Acompanhar no mapa
          </Botao>
        ) : (
          <div className="flex flex-col gap-3 pb-2">
            <Botao icone={<Check className="h-6 w-6" />} carregando={acao === "embarque"} disabled={acao !== null} onClick={confirmarEmbarque}>
              Confirmar embarque
            </Botao>
            <Botao variante="contornoPerigo" carregando={acao === "sair"} disabled={acao !== null} onClick={sair}>
              Sair da fila
            </Botao>
          </div>
        )}
      </div>
    </>
  );
}

function CartaoChamado({ fila }: { fila: FilaStatus }) {
  const agora = useRelogio(1000);
  const restante = fila.prazoEmbarque ? Math.max(0, new Date(fila.prazoEmbarque).getTime() - agora) : 0;
  const min = Math.floor(restante / 60000);
  const seg = Math.floor((restante % 60000) / 1000);
  return (
    <section className="flex flex-col items-center rounded-4xl bg-verde px-6 py-7 text-center text-white">
      <span className="text-sm font-semibold tracking-[0.2em] text-white/80">É A SUA VEZ!</span>
      <span className="mt-1 text-2xl font-bold">Vá até {fila.parada}</span>
      <span className="mt-2 text-white/90">
        {fila.minutosAteVeiculo != null && `${fila.viagem.veiculo?.nome ?? "Veículo"} a ${fila.minutosAteVeiculo} min · `}
        confirme o embarque em
      </span>
      <span className="mt-1 text-5xl font-bold tabular-nums">
        {min}:{String(seg).padStart(2, "0")}
      </span>
    </section>
  );
}

function ChipBranco({ icone, children }: { icone: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-semibold text-azul">
      {icone}
      {children}
    </span>
  );
}

function LinhaSaida({ viagem, atual, aoClicar, selecionada }: { viagem: Viagem; atual?: boolean; aoClicar?: () => void; selecionada?: boolean }) {
  const conteudo = (
    <>
      <span className="w-16 text-xl font-bold">{viagem.horaSaida}</span>
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate font-semibold">
          {viagem.veiculo?.nome ?? "Veículo"}
          {atual && <span className="ml-2 text-xs font-medium text-azul">sua fila</span>}
        </div>
        <div className="truncate text-xs text-cinza">
          {viagem.linha} · Ocupação {viagem.lotacao}/{viagem.capacidade}
          {viagem.naFila > 0 && ` · ${viagem.naFila} na fila`}
        </div>
      </div>
      <span className={classes("h-3 w-3 shrink-0 rounded-full", corLotacao(viagem.lotacao + viagem.naFila, viagem.capacidade))} />
    </>
  );
  const estilo = classes(
    "flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-cartao",
    selecionada && "ring-2 ring-azul",
  );
  return aoClicar ? (
    <button type="button" onClick={aoClicar} className={estilo}>
      {conteudo}
    </button>
  ) : (
    <div className={estilo}>{conteudo}</div>
  );
}

// ------------------------------------------------------------------ aluno fora da fila

function EscolherSaida({ viagens, aoEntrar }: { viagens: Viagem[] | null; aoEntrar: (f: FilaStatus) => void }) {
  const { linhas } = useLinhas();
  const { posicao } = useMinhaPosicao();
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [paradaId, setParadaId] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const viagem = viagens?.find((v) => v.id === selecionada) ?? null;
  // a última parada é o destino: não faz sentido embarcar nela
  const pontos = useMemo(() => {
    const linha = linhas?.find((l) => l.id === viagem?.linhaId);
    return linha ? linha.paradas.slice(0, -1) : [];
  }, [linhas, viagem?.linhaId]);
  const sugerida = paradaMaisProxima(pontos, posicao);
  const pontoEscolhido = paradaId ?? sugerida?.id ?? null;

  async function entrar() {
    if (!viagem) return;
    setErro(null);
    setEnviando(true);
    try {
      aoEntrar(await api.post<FilaStatus>("/fila", { viagemId: viagem.id, paradaId: pontoEscolhido }));
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <CabecalhoTela titulo="Fila virtual" subtitulo="Escolha a saída em que vai embarcar" />
      <div className="flex flex-col gap-3 px-4">
        {viagens === null && <Carregando />}
        {viagens !== null && viagens.length === 0 && (
          <Vazio icone={<Users className="h-7 w-7" />} titulo="Nenhuma saída disponível">
            Não há mais saídas hoje para entrar na fila.
          </Vazio>
        )}

        {viagens?.map((v) => (
          <LinhaSaida
            key={v.id}
            viagem={v}
            selecionada={v.id === selecionada}
            aoClicar={() => {
              setSelecionada(v.id);
              setParadaId(null);
            }}
          />
        ))}

        {viagem && (
          <Cartao className="flex flex-col gap-3">
            <label className="text-sm font-medium" htmlFor="ponto">
              Onde você vai embarcar?
            </label>
            <select
              id="ponto"
              value={pontoEscolhido ?? ""}
              onChange={(e) => setParadaId(Number(e.target.value))}
              className="h-12 rounded-2xl border border-cinza-linha bg-fundo px-3 text-base"
            >
              {pontos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                  {p.id === sugerida?.id && posicao ? " (mais perto de você)" : ""}
                </option>
              ))}
            </select>
            {erro && <Alerta tipo="erro">{erro}</Alerta>}
            <Botao icone={<Users className="h-6 w-6" />} carregando={enviando} onClick={entrar}>
              Entrar na fila das {viagem.horaSaida}
            </Botao>
          </Cartao>
        )}
      </div>
    </>
  );
}
