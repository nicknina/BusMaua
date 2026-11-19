import { Bus, Radio, Users } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Mapa, type MarcadorVeiculo } from "../../components/Mapa";
import { Alerta, Carregando, classes } from "../../components/ui";
import { api } from "../../lib/api";
import { useViagensHoje } from "../../lib/hooks";
import type { DemandaHorario, ResumoAdmin } from "../../lib/tipos";

/** Frota ao vivo, resumo do dia e demanda por horário (solicitações × embarques). */
export function VisaoGeral() {
  const [resumo, setResumo] = useState<ResumoAdmin | null>(null);
  const [demanda, setDemanda] = useState<DemandaHorario[] | null>(null);
  const [dias, setDias] = useState(14);
  const [erro, setErro] = useState<string | null>(null);
  const { viagens } = useViagensHoje();

  useEffect(() => {
    api.get<ResumoAdmin>("/admin/resumo").then(setResumo).catch((e: Error) => setErro(e.message));
  }, [viagens]);

  useEffect(() => {
    setDemanda(null);
    api
      .get<DemandaHorario[]>(`/admin/demanda?dias=${dias}`)
      .then(setDemanda)
      .catch((e: Error) => setErro(e.message));
  }, [dias]);

  const emRota = (viagens ?? []).filter((v) => v.status === "EM_ANDAMENTO" || v.status === "PAUSADA");
  const marcadores: MarcadorVeiculo[] = emRota
    .filter((v) => v.latitude != null && v.longitude != null)
    .map((v) => ({
      id: v.id,
      ponto: { lat: v.latitude as number, lng: v.longitude as number },
      tipo: v.veiculo?.tipo ?? "ONIBUS",
      rotulo: `${v.veiculo?.nome ?? "Veículo"} · ${v.lotacao}/${v.capacidade}`,
      destaque: true,
    }));
  const maiorMedia = Math.max(1, ...(demanda ?? []).map((d) => d.mediaSolicitacoes));

  return (
    <div className="flex flex-col gap-6">
        {erro && <Alerta tipo="erro">{erro}</Alerta>}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <CartaoNumero rotulo="Veículos ativos" valor={resumo?.veiculosAtivos} icone={<Bus className="h-5 w-5" />} />
          <CartaoNumero rotulo="Saídas hoje" valor={resumo?.viagensHoje} />
          <CartaoNumero rotulo="Em rota agora" valor={resumo?.viagensEmAndamento} icone={<Radio className="h-5 w-5" />} />
          <CartaoNumero rotulo="Solicitações hoje" valor={resumo?.solicitacoesHoje} icone={<Users className="h-5 w-5" />} />
          <CartaoNumero rotulo="Embarques hoje" valor={resumo?.embarquesHoje} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl bg-white p-4 shadow-cartao">
            <h2 className="mb-3 text-lg font-semibold">Frota ao vivo</h2>
            <Mapa className="h-80 rounded-2xl" veiculos={marcadores} />
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-cartao">
            <h2 className="mb-3 text-lg font-semibold">Viagens em curso</h2>
            {viagens === null ? (
              <Carregando />
            ) : emRota.length === 0 ? (
              <p className="text-sm text-cinza">Nenhum veículo na rua agora.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {emRota.map((v) => (
                  <li key={v.id} className="rounded-2xl bg-fundo px-4 py-3">
                    <div className="flex items-center justify-between font-semibold">
                      <span>
                        {v.veiculo?.nome} · {v.horaSaida}
                      </span>
                      <span className={v.status === "PAUSADA" ? "text-ambar-escuro" : "text-verde"}>
                        {v.status === "PAUSADA" ? "Pausada" : "Em rota"}
                      </span>
                    </div>
                    <div className="text-sm text-cinza">
                      {v.linha} · {v.motorista} · {v.lotacao}/{v.capacidade} a bordo · {v.naFila} na fila
                      {v.atrasoMinutos > 0 && ` · atraso ${v.atrasoMinutos} min`}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-cartao">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Demanda por horário</h2>
            <div className="flex gap-1 rounded-full bg-fundo p-1">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDias(d)}
                  className={classes(
                    "rounded-full px-3 py-1 text-sm font-semibold",
                    dias === d ? "bg-azul text-white" : "text-cinza",
                  )}
                >
                  {d} dias
                </button>
              ))}
            </div>
          </div>
          <p className="mb-4 text-sm text-cinza">
            Média por saída nos últimos {dias} dias. A indicação de veículo é apenas um apoio: a escala da frota
            continua sendo decisão da gestão.
          </p>

          {demanda === null ? (
            <Carregando />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-cinza">
                  <tr className="border-b border-cinza-linha">
                    <th className="py-2 pr-3 font-medium">Saída</th>
                    <th className="py-2 pr-3 font-medium">Linha</th>
                    <th className="w-[30%] py-2 pr-3 font-medium">Solicitações × embarques</th>
                    <th className="py-2 pr-3 font-medium">Comparecimento</th>
                    <th className="py-2 pr-3 font-medium">Ocupação média</th>
                    <th className="py-2 pr-3 font-medium">Escalado</th>
                    <th className="py-2 font-medium">Indicação</th>
                  </tr>
                </thead>
                <tbody>
                  {demanda.map((d) => {
                    // destaca quando a demanda sugere outro tipo de veículo que não o escalado
                    const tipoEscalado = d.capacidadeEscalada > 16 ? "Ônibus" : "Van";
                    const divergente = (d.indicacao === "Ônibus" || d.indicacao === "Van") && d.indicacao !== tipoEscalado;
                    return (
                      <tr key={d.horarioId} className="border-b border-cinza-linha/60 last:border-0">
                        <td className="py-3 pr-3 text-base font-bold">{d.horaSaida}</td>
                        <td className="py-3 pr-3">{d.linha}</td>
                        <td className="py-3 pr-3">
                          <Barra valor={d.mediaSolicitacoes} maximo={maiorMedia} cor="bg-azul-medio" rotulo={`${d.mediaSolicitacoes} solicitações`} />
                          <Barra valor={d.mediaEmbarques} maximo={maiorMedia} cor="bg-azul" rotulo={`${d.mediaEmbarques} embarques`} />
                        </td>
                        <td className="py-3 pr-3">{d.taxaComparecimento}%</td>
                        <td className="py-3 pr-3">{d.ocupacaoMedia}%</td>
                        <td className="py-3 pr-3">
                          {d.veiculoEscalado} <span className="text-cinza">({d.capacidadeEscalada})</span>
                        </td>
                        <td className="py-3">
                          <span
                            className={classes(
                              "rounded-full px-3 py-1 text-xs font-semibold",
                              divergente ? "bg-ambar-claro text-ambar-escuro" : "bg-azul-claro text-azul",
                            )}
                          >
                            {d.indicacao}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
    </div>
  );
}

function CartaoNumero({ rotulo, valor, icone }: { rotulo: string; valor?: number; icone?: ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-cartao">
      <div className="flex items-center gap-2 text-sm text-cinza">
        {icone}
        {rotulo}
      </div>
      <div className="mt-1 text-3xl font-bold">{valor ?? "—"}</div>
    </div>
  );
}

function Barra({ valor, maximo, cor, rotulo }: { valor: number; maximo: number; cor: string; rotulo: string }) {
  return (
    <div className="mb-1 flex items-center gap-2" title={rotulo}>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-fundo">
        <div className={classes("h-full rounded-full", cor)} style={{ width: `${Math.min(100, (valor / maximo) * 100)}%` }} />
      </div>
      <span className="w-10 text-right tabular-nums text-xs text-cinza">{valor}</span>
    </div>
  );
}
