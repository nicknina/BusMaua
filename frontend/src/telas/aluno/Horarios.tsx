import { Bus, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alerta, CabecalhoTela, Carregando, Cartao, classes, Segmentado } from "../../components/ui";
import { minutosAgora, minutosDoDia, nomeCurtoLinha, somarMinutos } from "../../lib/formato";
import { useLinhas, useRelogio } from "../../lib/hooks";

export function Horarios() {
  const { linhas, erro } = useLinhas();
  useRelogio(30_000); // atualiza "próxima saída em X min"
  const [linhaId, setLinhaId] = useState<number | null>(null);
  const [horarioId, setHorarioId] = useState<number | null>(null);

  const linha = linhas?.find((l) => l.id === linhaId) ?? linhas?.[0] ?? null;
  const agora = minutosAgora();
  const proximo = useMemo(
    () => linha?.horarios.find((h) => minutosDoDia(h.horaSaida) >= agora) ?? null,
    [linha, agora],
  );
  const horario = linha?.horarios.find((h) => h.id === horarioId) ?? proximo ?? linha?.horarios[0] ?? null;

  // ao trocar o sentido, volta para a próxima saída
  useEffect(() => setHorarioId(null), [linhaId]);

  if (!linhas) {
    return (
      <>
        <CabecalhoTela titulo="Itinerários" subtitulo="Linhas e horários do campus" />
        {erro ? <div className="px-4"><Alerta tipo="erro">{erro}</Alerta></div> : <Carregando />}
      </>
    );
  }

  const faltam = proximo ? minutosDoDia(proximo.horaSaida) - agora : null;

  return (
    <>
      <CabecalhoTela titulo="Itinerários" subtitulo="Linhas e horários do campus" />
      <div className="flex flex-col gap-4 px-4">
        <Segmentado<number>
          valor={linha?.id ?? 0}
          aoMudar={setLinhaId}
          opcoes={linhas.map((l) => ({ valor: l.id, rotulo: nomeCurtoLinha(l.nome) }))}
        />

        {linha && (
          <div className="flex items-center gap-3 rounded-3xl bg-azul-claro px-4 py-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-azul text-white">
              <Bus className="h-6 w-6" />
            </span>
            {proximo && faltam !== null ? (
              <div className="min-w-0">
                <div className="text-lg font-bold">
                  Próxima saída {faltam === 0 ? "agora" : `em ${faltam} min`}
                </div>
                <div className="truncate text-sm text-cinza">
                  {[proximo.horaSaida, proximo.veiculo?.nome, proximo.localSaida].filter(Boolean).join(" · ")}
                </div>
              </div>
            ) : (
              <div className="min-w-0">
                <div className="text-lg font-bold">Sem mais saídas hoje</div>
                <div className="text-sm text-cinza">
                  {linha.horarios[0] ? `Primeira saída amanhã às ${linha.horarios[0].horaSaida}` : "Nenhum horário cadastrado"}
                </div>
              </div>
            )}
          </div>
        )}

        {linha && linha.horarios.length > 0 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Horários de saída">
            {linha.horarios.map((h) => {
              const passou = minutosDoDia(h.horaSaida) < agora;
              return (
                <button
                  key={h.id}
                  type="button"
                  role="tab"
                  aria-selected={h.id === horario?.id}
                  onClick={() => setHorarioId(h.id)}
                  className={classes(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-semibold",
                    h.id === horario?.id ? "bg-azul text-white" : "bg-white text-tinta shadow-cartao",
                    passou && h.id !== horario?.id && "text-cinza-claro",
                  )}
                >
                  {h.horaSaida}
                </button>
              );
            })}
          </div>
        )}

        {linha && horario && (
          <Cartao className="px-5 py-6">
            <ol className="relative">
              {linha.paradas.map((p, i) => {
                const primeira = i === 0;
                const ultima = i === linha.paradas.length - 1;
                return (
                  <li key={p.id} className="relative flex gap-4 pb-7 last:pb-0">
                    <span className={classes("w-14 shrink-0 text-lg font-bold", primeira ? "text-azul" : "text-tinta")}>
                      {somarMinutos(horario.horaSaida, p.minutosDesdeSaida)}
                    </span>
                    <span className="relative flex w-4 shrink-0 justify-center">
                      {!ultima && <span className="absolute top-3 h-[calc(100%+1.75rem)] w-1 bg-azul-medio" />}
                      <span
                        className={classes(
                          "relative mt-1.5 h-4 w-4 rounded-full border-[3px] border-azul",
                          primeira ? "bg-azul" : "bg-white",
                        )}
                      />
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold leading-tight">{p.nome}</div>
                      {p.descricao && <div className="text-xs text-cinza">{p.descricao}</div>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Cartao>
        )}

        <p className="flex items-center gap-2 px-1 pb-2 text-sm text-cinza">
          <Clock className="h-4 w-4 shrink-0" /> Horários podem variar; o mapa mostra o veículo ao vivo.
        </p>
      </div>
    </>
  );
}
