import { ArrowLeftRight, Bell, Clock, Radio, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mapa, type MarcadorVeiculo } from "../../components/Mapa";
import {
  Alerta,
  BarraProgresso,
  Botao,
  Carregando,
  Indicador,
  Selo,
  Vazio,
} from "../../components/ui";
import { api, mensagemDeErro } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { primeiroNome, rotuloStatus } from "../../lib/formato";
import { minutosAteParada, paradaMaisProxima } from "../../lib/geo";
import {
  useLinhas,
  useMinhaFila,
  useMinhaPosicao,
  useNotificacoes,
  useViagensHoje,
} from "../../lib/hooks";
import type { FilaStatus, Linha, Parada, Viagem } from "../../lib/tipos";

function nomeLugar(lugar: string) {
  return lugar === "Instituto Mauá" ? "Mauá" : lugar;
}

/** Ponto de referência do aluno para o ETA: o da fila, senão o mais perto dele. */
function pontoDoAluno(
  viagem: Viagem,
  linha: Linha | undefined,
  fila: FilaStatus | null | undefined,
  posicao: { lat: number; lng: number } | null,
): Parada | null {
  if (!linha) return null;
  if (fila && fila.viagem.id === viagem.id) {
    return linha.paradas.find((p) => p.id === fila.paradaId) ?? null;
  }
  return paradaMaisProxima(linha.paradas.slice(0, -1), posicao);
}

export function MapaAoVivo() {
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const { viagens, erro } = useViagensHoje();
  const { linhas } = useLinhas();
  const { fila } = useMinhaFila();
  const { naoLidas } = useNotificacoes();
  const { posicao } = useMinhaPosicao();
  const [selecionadaId, setSelecionadaId] = useState<number | null>(null);
  const [entrando, setEntrando] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const lista = useMemo(() => viagens ?? [], [viagens]);

  const destaque = useMemo<Viagem | null>(() => {
    const escolhida = selecionadaId
      ? lista.find((v) => v.id === selecionadaId)
      : undefined;
    if (escolhida) return escolhida;
    if (fila) return lista.find((v) => v.id === fila.viagem.id) ?? fila.viagem;
    return (
      lista.find((v) => v.status === "EM_ANDAMENTO") ??
      lista.find((v) => v.status === "PAUSADA") ??
      lista[0] ??
      null
    );
  }, [lista, selecionadaId, fila]);

  const linhaDestaque = linhas?.find((l) => l.id === destaque?.linhaId);
  const paradaAluno = destaque
    ? pontoDoAluno(destaque, linhaDestaque, fila, posicao)
    : null;
  const chegada =
    destaque && paradaAluno ? minutosAteParada(destaque, paradaAluno) : null;

  const marcadores = useMemo<MarcadorVeiculo[]>(
    () =>
      lista
        .filter(
          (v) =>
            v.status === "EM_ANDAMENTO" &&
            v.latitude != null &&
            v.longitude != null,
        )
        .map((v) => {
          const linha = linhas?.find((l) => l.id === v.linhaId);
          const parada = pontoDoAluno(v, linha, fila, posicao);
          const minutos = parada ? minutosAteParada(v, parada) : null;
          const nome = v.veiculo?.nome ?? "Veículo";
          const ehDestaque = v.id === destaque?.id;
          return {
            id: v.id,
            ponto: { lat: v.latitude as number, lng: v.longitude as number },
            tipo: v.veiculo?.tipo ?? "ONIBUS",
            destaque: ehDestaque,
            rotulo:
              ehDestaque && minutos != null ? `${nome} · ${minutos} min` : nome,
          };
        }),
    [lista, linhas, fila, posicao, destaque?.id],
  );

  async function entrarNaFila() {
    if (!destaque) return;
    setErroAcao(null);
    setEntrando(true);
    try {
      await api.post("/fila", {
        viagemId: destaque.id,
        paradaId: paradaAluno?.id ?? null,
      });
      navegar("/aluno/fila");
    } catch (e) {
      setErroAcao(mensagemDeErro(e));
    } finally {
      setEntrando(false);
    }
  }

  const status = destaque ? rotuloStatus(destaque) : null;
  const estaNestaFila = fila && destaque && fila.viagem.id === destaque.id;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between px-5 pt-6">
        <div>
          <h1 className="text-3xl font-bold leading-tight">
            Olá, {usuario ? primeiroNome(usuario.nome) : ""}
          </h1>
          <p className="text-cinza">Acompanhe o transporte ao vivo</p>
        </div>
        <Link
          to="/aluno/notificacoes"
          aria-label={
            naoLidas > 0 ? `Notificações (${naoLidas} novas)` : "Notificações"
          }
          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-cartao"
        >
          <Bell className="h-6 w-6" />
          {naoLidas > 0 && (
            <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-vermelho ring-2 ring-white" />
          )}
        </Link>
      </header>

      <Mapa
        className="mx-4 h-[360px] rounded-3xl"
        rota={linhaDestaque?.paradas}
        veiculos={marcadores}
        voce={posicao ? { ponto: posicao, estilo: "aluno" } : null}
        aoClicarVeiculo={setSelecionadaId}
      >
        <div className="p-3">
          {marcadores.length > 0 ? (
            <Selo cor="branco" className="text-verde shadow-cartao">
              <span className="h-2.5 w-2.5 rounded-full bg-verde" /> AO VIVO
            </Selo>
          ) : (
            <Selo cor="branco" className="text-cinza shadow-cartao">
              Nenhum veículo em rota agora
            </Selo>
          )}
        </div>
      </Mapa>

      <section className="flex flex-col gap-3 px-4">
        {erro && <Alerta tipo="erro">{erro}</Alerta>}
        {viagens === null && !erro && <Carregando />}

        {viagens !== null && !destaque && (
          <Vazio
            icone={<Clock className="h-7 w-7" />}
            titulo="Sem mais saídas hoje"
          >
            Veja a grade completa em{" "}
            <Link to="/aluno/horarios" className="font-semibold text-azul">
              Horários
            </Link>
            .
          </Vazio>
        )}

        {destaque && status && (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="flex flex-wrap items-center gap-x-1 text-xl font-bold leading-tight">
                  {nomeLugar(destaque.origem)}
                  <ArrowLeftRight className="h-4 w-4 shrink-0" />
                  {nomeLugar(destaque.destino)}
                </h2>
                <p className="truncate text-sm text-cinza">
                  {[
                    destaque.veiculo?.nome,
                    destaque.localSaida && `Saindo do ${destaque.localSaida}`,
                    `hoje, ${destaque.horaSaida}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <Selo
                cor={status.cor}
                icone={
                  status.cor === "verde" ? (
                    <Radio className="h-4 w-4" />
                  ) : undefined
                }
              >
                {status.texto}
              </Selo>
            </div>

            <div className="flex gap-2">
              <Indicador
                rotulo={
                  paradaAluno ? `Chegada · ${paradaAluno.nome}` : "Chegada"
                }
                valor={chegada != null ? `${chegada} min` : "—"}
              />
              <Indicador
                rotulo="Lotação"
                valor={`${destaque.lotacao}/${destaque.capacidade}`}
              />
              <Indicador
                rotulo="Motorista"
                valor={
                  destaque.motorista ? primeiroNome(destaque.motorista) : "—"
                }
              />
            </div>
            <BarraProgresso
              valor={destaque.lotacao}
              maximo={destaque.capacidade}
            />

            {erroAcao && <Alerta tipo="erro">{erroAcao}</Alerta>}

            {fila ? (
              <Botao
                icone={<Users className="h-6 w-6" />}
                onClick={() => navegar("/aluno/fila")}
                className="mt-1"
              >
                {estaNestaFila ? "Ver minha posição na fila" : "Ver minha fila"}
              </Botao>
            ) : (
              <Botao
                icone={<Users className="h-6 w-6" />}
                carregando={entrando}
                onClick={entrarNaFila}
                className="mt-1"
              >
                Entrar na fila virtual
              </Botao>
            )}
          </>
        )}
      </section>
    </div>
  );
}
