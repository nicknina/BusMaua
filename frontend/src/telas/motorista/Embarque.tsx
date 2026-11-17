import { Check, Minus, Plus, Radio, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alerta, Botao, CabecalhoMotorista, Carregando, Cartao, Selo, Vazio } from "../../components/ui";
import { api, mensagemDeErro } from "../../lib/api";
import { hora } from "../../lib/formato";
import { useIntervalo } from "../../lib/hooks";
import { assinar } from "../../lib/tempoReal";
import type { EntradaFila, Viagem } from "../../lib/tipos";
import { useMotorista } from "./LayoutMotorista";

export function Embarque() {
  const { viagem } = useMotorista();
  if (viagem === undefined) return <Carregando />;
  if (!viagem) {
    return (
      <>
        <CabecalhoMotorista titulo="Embarque" />
        <Vazio icone={<Users className="h-7 w-7" />} titulo="Nenhuma viagem em andamento">
          <Link to="/motorista/viagem" className="font-semibold text-azul">
            Inicie uma viagem
          </Link>{" "}
          para ver a fila de embarque.
        </Vazio>
      </>
    );
  }
  return <ControleEmbarque viagem={viagem} />;
}

function ControleEmbarque({ viagem }: { viagem: Viagem }) {
  const { definirViagem } = useMotorista();
  const [fila, setFila] = useState<EntradaFila[] | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(() => {
    api
      .get<EntradaFila[]>(`/motorista/viagens/${viagem.id}/fila`)
      .then(setFila)
      .catch((e: Error) => setErro(e.message));
  }, [viagem.id]);

  useEffect(() => {
    carregar();
    return assinar(`/topic/viagens/${viagem.id}/fila`, carregar);
  }, [viagem.id, carregar]);
  useIntervalo(carregar, 15_000);

  async function ajustarLotacao(delta: number) {
    setErro(null);
    setProcessando(`lotacao${delta}`);
    try {
      definirViagem(await api.post<Viagem>(`/motorista/viagens/${viagem.id}/lotacao`, { delta }));
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setProcessando(null);
    }
  }

  async function confirmar(entrada: EntradaFila) {
    setErro(null);
    setProcessando(`entrada${entrada.id}`);
    try {
      setFila(await api.post<EntradaFila[]>(`/motorista/viagens/${viagem.id}/fila/${entrada.id}/confirmar`));
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setProcessando(null);
    }
  }

  async function liberarSaida() {
    setErro(null);
    setProcessando("liberar");
    try {
      definirViagem(await api.post<Viagem>(`/motorista/viagens/${viagem.id}/liberar-saida`));
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setProcessando(null);
    }
  }

  const aguardando = (fila ?? []).filter((e) => e.status !== "EMBARCADO").length;
  const lotado = viagem.lotacao >= viagem.capacidade;

  return (
    <>
      <CabecalhoMotorista titulo="Embarque" subtitulo={`${viagem.veiculo?.nome ?? "Veículo"} · saída ${viagem.horaSaida}`} />
      <div className="flex flex-col gap-4 px-4 pt-4">
        <Cartao className="flex items-center justify-between">
          <div>
            <div className="text-sm text-cinza">Lotação atual</div>
            <div className="text-5xl font-bold leading-none">
              {viagem.lotacao}
              <span className="ml-1 text-xl font-medium text-cinza">/ {viagem.capacidade}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              aria-label="Diminuir lotação"
              disabled={processando !== null || viagem.lotacao <= 0}
              onClick={() => ajustarLotacao(-1)}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-azul text-azul disabled:opacity-40"
            >
              <Minus className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Aumentar lotação"
              disabled={processando !== null || lotado}
              onClick={() => ajustarLotacao(1)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-azul text-white disabled:opacity-40"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
        </Cartao>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Fila de espera</h2>
          <span className="rounded-full bg-white px-3 py-1 text-sm text-cinza shadow-cartao">
            {aguardando} {aguardando === 1 ? "aluno" : "alunos"}
          </span>
        </div>

        {erro && <Alerta tipo="erro">{erro}</Alerta>}
        {fila === null && !erro && <Carregando />}
        {fila?.length === 0 && (
          <Vazio titulo="Ninguém na fila">Os alunos que entrarem na fila desta saída aparecem aqui.</Vazio>
        )}

        <ul className="flex flex-col gap-2">
          {fila?.map((e) => (
            <li key={e.id} className="flex items-center gap-3 rounded-3xl bg-white px-4 py-3 shadow-cartao">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-azul-claro font-semibold text-azul">
                {e.iniciais}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{e.nome}</div>
                <div className="truncate text-xs text-cinza">
                  {e.parada}
                  {e.status === "CHAMADO" && " · chamado"}
                </div>
              </div>
              {e.status === "EMBARCADO" ? (
                <Selo cor="verde" icone={<Check className="h-4 w-4" />}>
                  Check-in feito
                </Selo>
              ) : (
                <button
                  type="button"
                  disabled={processando !== null || lotado}
                  onClick={() => confirmar(e)}
                  className="rounded-full bg-azul px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {processando === `entrada${e.id}` ? "..." : "Confirmar"}
                </button>
              )}
            </li>
          ))}
        </ul>

        {viagem.saidaLiberadaEm ? (
          <Alerta tipo="sucesso" icone={<Radio className="h-5 w-5" />}>
            Saída liberada às {hora(viagem.saidaLiberadaEm)} com {viagem.lotacao} a bordo.
          </Alerta>
        ) : (
          <Botao
            variante="sucesso"
            icone={<Check className="h-6 w-6" />}
            carregando={processando === "liberar"}
            disabled={processando !== null}
            onClick={liberarSaida}
            className="mt-2"
          >
            Saída liberada · {viagem.lotacao} a bordo
          </Botao>
        )}
      </div>
    </>
  );
}
