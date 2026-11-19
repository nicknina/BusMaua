import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Carregando, classes } from "../../components/ui";
import { api } from "../../lib/api";
import type { HorarioAdmin, LinhaAdmin, VeiculoAdmin } from "../../lib/tipos";
import { BotaoAdmin, Campo, Mensagem, Secao, Selecao, SeloStatus, useAcao } from "./componentesAdmin";

interface FormHorario {
  horaSaida: string;
  localSaida: string;
  veiculoId: string;
  ativo: boolean;
}

function paraForm(h: HorarioAdmin): FormHorario {
  return { horaSaida: h.horaSaida, localSaida: h.localSaida ?? "", veiculoId: h.veiculo ? String(h.veiculo.id) : "", ativo: h.ativo };
}

function paraCorpo(f: FormHorario) {
  return {
    horaSaida: f.horaSaida,
    localSaida: f.localSaida.trim() || null,
    veiculoId: f.veiculoId ? Number(f.veiculoId) : null,
    ativo: f.ativo,
  };
}

export function GestaoHorarios() {
  const [linhas, setLinhas] = useState<LinhaAdmin[] | null>(null);
  const [veiculos, setVeiculos] = useState<VeiculoAdmin[]>([]);
  const [linhaId, setLinhaId] = useState<number | null>(null);
  const [novo, setNovo] = useState<FormHorario>({ horaSaida: "", localSaida: "", veiculoId: "", ativo: true });
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [edicao, setEdicao] = useState<FormHorario | null>(null);
  const { executar, executando, erro, sucesso } = useAcao();

  useEffect(() => {
    executar("carregar", async () => {
      const [l, v] = await Promise.all([api.get<LinhaAdmin[]>("/admin/linhas"), api.get<VeiculoAdmin[]>("/admin/veiculos")]);
      setLinhas(l);
      setVeiculos(v);
    });
  }, [executar]);

  const linha = linhas?.find((l) => l.id === linhaId) ?? linhas?.[0] ?? null;
  const ativos = veiculos.filter((v) => v.ativo);

  function substituirLinha(atualizada: LinhaAdmin) {
    setLinhas((lista) => lista?.map((l) => (l.id === atualizada.id ? atualizada : l)) ?? null);
  }

  async function criar() {
    if (!linha) return;
    const atualizada = await executar(
      "criar",
      () => api.post<LinhaAdmin>(`/admin/linhas/${linha.id}/horarios`, paraCorpo(novo)),
      `Saída das ${novo.horaSaida} adicionada.`,
    );
    if (atualizada) {
      substituirLinha(atualizada);
      setNovo({ ...novo, horaSaida: "" });
    }
  }

  async function salvar(id: number, form: FormHorario, mensagem: string) {
    const atualizada = await executar(`salvar${id}`, () => api.put<LinhaAdmin>(`/admin/horarios/${id}`, paraCorpo(form)), mensagem);
    if (atualizada) {
      substituirLinha(atualizada);
      setEditandoId(null);
    }
  }

  if (!linhas) return erro ? <Mensagem erro={erro} sucesso={null} /> : <Carregando />;

  const opcoesVeiculo = (
    <>
      <option value="">Sem veículo escalado</option>
      {ativos.map((v) => (
        <option key={v.id} value={v.id}>
          {v.nome} · {v.capacidade} lugares
        </option>
      ))}
    </>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {linhas.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => {
              setLinhaId(l.id);
              setEditandoId(null);
            }}
            className={classes(
              "rounded-full px-4 py-2 text-sm font-semibold",
              l.id === linha?.id ? "bg-azul text-white" : "bg-white text-tinta shadow-cartao",
            )}
          >
            {l.nome}
          </button>
        ))}
      </div>

      {linha && (
        <Secao titulo="Nova saída" descricao={`Linha ${linha.nome}. O veículo escalado é o padrão; o motorista pode trocar ao iniciar a viagem.`}>
          <div className="grid gap-3 md:grid-cols-[1fr_1.5fr_2fr_auto] md:items-end">
            <Campo rotulo="Horário" type="time" value={novo.horaSaida} onChange={(e) => setNovo({ ...novo, horaSaida: e.target.value })} />
            <Campo rotulo="Local de saída" placeholder="Ex.: Bloco A" value={novo.localSaida} onChange={(e) => setNovo({ ...novo, localSaida: e.target.value })} />
            <Selecao rotulo="Veículo escalado" value={novo.veiculoId} onChange={(e) => setNovo({ ...novo, veiculoId: e.target.value })}>
              {opcoesVeiculo}
            </Selecao>
            <BotaoAdmin carregando={executando === "criar"} disabled={!novo.horaSaida} onClick={criar}>
              <Plus className="h-4 w-4" /> Adicionar
            </BotaoAdmin>
          </div>
        </Secao>
      )}

      <Mensagem erro={erro} sucesso={sucesso} />

      {linha && (
        <Secao titulo="Grade de horários" descricao="Saídas inativas deixam de aparecer para alunos e motoristas, mas o histórico é mantido.">
          {linha.horarios.length === 0 ? (
            <p className="text-sm text-cinza">Nenhuma saída cadastrada nesta linha.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-cinza">
                  <tr className="border-b border-cinza-linha">
                    <th className="py-2 pr-3 font-medium">Saída</th>
                    <th className="py-2 pr-3 font-medium">Local</th>
                    <th className="py-2 pr-3 font-medium">Veículo escalado</th>
                    <th className="py-2 pr-3 font-medium">Situação</th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {linha.horarios.map((h) =>
                    editandoId === h.id && edicao ? (
                      <tr key={h.id} className="border-b border-cinza-linha/60 bg-azul-claro/40">
                        <td className="py-2 pr-2"><Campo type="time" value={edicao.horaSaida} onChange={(e) => setEdicao({ ...edicao, horaSaida: e.target.value })} /></td>
                        <td className="py-2 pr-2"><Campo value={edicao.localSaida} onChange={(e) => setEdicao({ ...edicao, localSaida: e.target.value })} /></td>
                        <td className="py-2 pr-2">
                          <Selecao value={edicao.veiculoId} onChange={(e) => setEdicao({ ...edicao, veiculoId: e.target.value })}>
                            {opcoesVeiculo}
                          </Selecao>
                        </td>
                        <td className="py-2 pr-2"><SeloStatus ativo={edicao.ativo} /></td>
                        <td className="py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <BotaoAdmin carregando={executando === `salvar${h.id}`} onClick={() => salvar(h.id, edicao, "Saída atualizada.")}>
                              Salvar
                            </BotaoAdmin>
                            <BotaoAdmin variante="texto" onClick={() => setEditandoId(null)}>Cancelar</BotaoAdmin>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={h.id} className={classes("border-b border-cinza-linha/60 last:border-0", !h.ativo && "text-cinza")}>
                        <td className="py-3 pr-3 text-base font-bold">{h.horaSaida}</td>
                        <td className="py-3 pr-3">{h.localSaida ?? "—"}</td>
                        <td className="py-3 pr-3">{h.veiculo ? `${h.veiculo.nome} (${h.veiculo.capacidade})` : "—"}</td>
                        <td className="py-3 pr-3"><SeloStatus ativo={h.ativo} /></td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <BotaoAdmin
                              variante="texto"
                              onClick={() => {
                                setEditandoId(h.id);
                                setEdicao(paraForm(h));
                              }}
                            >
                              Editar
                            </BotaoAdmin>
                            <BotaoAdmin
                              variante={h.ativo ? "perigo" : "secundario"}
                              carregando={executando === `salvar${h.id}`}
                              onClick={() =>
                                salvar(h.id, { ...paraForm(h), ativo: !h.ativo }, h.ativo ? `Saída das ${h.horaSaida} desativada.` : `Saída das ${h.horaSaida} reativada.`)
                              }
                            >
                              {h.ativo ? "Desativar" : "Reativar"}
                            </BotaoAdmin>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Secao>
      )}
    </div>
  );
}
