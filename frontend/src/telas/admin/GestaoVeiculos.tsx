import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Carregando } from "../../components/ui";
import { api } from "../../lib/api";
import type { TipoVeiculo, VeiculoAdmin } from "../../lib/tipos";
import { BotaoAdmin, Campo, Mensagem, Secao, Selecao, SeloStatus, useAcao } from "./componentesAdmin";

interface FormVeiculo {
  nome: string;
  placa: string;
  tipo: TipoVeiculo;
  capacidade: string;
  ativo: boolean;
}

const VAZIO: FormVeiculo = { nome: "", placa: "", tipo: "ONIBUS", capacidade: "44", ativo: true };

function paraForm(v: VeiculoAdmin): FormVeiculo {
  return { nome: v.nome, placa: v.placa, tipo: v.tipo, capacidade: String(v.capacidade), ativo: v.ativo };
}

function paraCorpo(f: FormVeiculo) {
  return { ...f, nome: f.nome.trim(), placa: f.placa.trim(), capacidade: Number(f.capacidade) };
}

export function GestaoVeiculos() {
  const [veiculos, setVeiculos] = useState<VeiculoAdmin[] | null>(null);
  const [novo, setNovo] = useState<FormVeiculo>(VAZIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [edicao, setEdicao] = useState<FormVeiculo>(VAZIO);
  const { executar, executando, erro, sucesso } = useAcao();

  const carregar = () => api.get<VeiculoAdmin[]>("/admin/veiculos").then(setVeiculos);
  useEffect(() => {
    executar("carregar", carregar);
  }, [executar]);

  async function criar() {
    const criado = await executar("criar", () => api.post<VeiculoAdmin>("/admin/veiculos", paraCorpo(novo)), "Veículo cadastrado.");
    if (criado) {
      setNovo(VAZIO);
      carregar();
    }
  }

  async function salvar(id: number, form: FormVeiculo, mensagem = "Veículo atualizado.") {
    const salvo = await executar(`salvar${id}`, () => api.put<VeiculoAdmin>(`/admin/veiculos/${id}`, paraCorpo(form)), mensagem);
    if (salvo) {
      setVeiculos((lista) => lista?.map((v) => (v.id === id ? salvo : v)) ?? null);
      setEditandoId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Secao titulo="Novo veículo" descricao="Vans atendem horários de menor movimento; ônibus, os horários de pico.">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-end">
          <Campo rotulo="Nome exibido aos alunos" placeholder="Ex.: Ônibus 03" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
          <Campo rotulo="Placa" placeholder="ABC-1D23" value={novo.placa} onChange={(e) => setNovo({ ...novo, placa: e.target.value })} />
          <Selecao
            rotulo="Tipo"
            value={novo.tipo}
            onChange={(e) => {
              const tipo = e.target.value as TipoVeiculo;
              setNovo({ ...novo, tipo, capacidade: tipo === "VAN" ? "16" : "44" });
            }}
          >
            <option value="ONIBUS">Ônibus</option>
            <option value="VAN">Van</option>
          </Selecao>
          <Campo rotulo="Capacidade" type="number" min={1} value={novo.capacidade} onChange={(e) => setNovo({ ...novo, capacidade: e.target.value })} />
          <BotaoAdmin carregando={executando === "criar"} onClick={criar} disabled={!novo.nome.trim() || !novo.placa.trim()}>
            <Plus className="h-4 w-4" /> Cadastrar
          </BotaoAdmin>
        </div>
      </Secao>

      <Mensagem erro={erro} sucesso={sucesso} />

      <Secao titulo="Frota" descricao="Veículos inativos não aparecem para os motoristas nem podem ser escalados.">
        {!veiculos ? (
          <Carregando />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-cinza">
                <tr className="border-b border-cinza-linha">
                  <th className="py-2 pr-3 font-medium">Nome</th>
                  <th className="py-2 pr-3 font-medium">Placa</th>
                  <th className="py-2 pr-3 font-medium">Tipo</th>
                  <th className="py-2 pr-3 font-medium">Capacidade</th>
                  <th className="py-2 pr-3 font-medium">Situação</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {veiculos.map((v) =>
                  editandoId === v.id ? (
                    <tr key={v.id} className="border-b border-cinza-linha/60 bg-azul-claro/40">
                      <td className="py-2 pr-2"><Campo value={edicao.nome} onChange={(e) => setEdicao({ ...edicao, nome: e.target.value })} /></td>
                      <td className="py-2 pr-2"><Campo value={edicao.placa} onChange={(e) => setEdicao({ ...edicao, placa: e.target.value })} /></td>
                      <td className="py-2 pr-2">
                        <Selecao value={edicao.tipo} onChange={(e) => setEdicao({ ...edicao, tipo: e.target.value as TipoVeiculo })}>
                          <option value="ONIBUS">Ônibus</option>
                          <option value="VAN">Van</option>
                        </Selecao>
                      </td>
                      <td className="py-2 pr-2"><Campo type="number" min={1} value={edicao.capacidade} onChange={(e) => setEdicao({ ...edicao, capacidade: e.target.value })} /></td>
                      <td className="py-2 pr-2"><SeloStatus ativo={edicao.ativo} /></td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <BotaoAdmin carregando={executando === `salvar${v.id}`} onClick={() => salvar(v.id, edicao)}>Salvar</BotaoAdmin>
                          <BotaoAdmin variante="texto" onClick={() => setEditandoId(null)}>Cancelar</BotaoAdmin>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={v.id} className="border-b border-cinza-linha/60 last:border-0">
                      <td className="py-3 pr-3 font-semibold">{v.nome}</td>
                      <td className="py-3 pr-3">{v.placa}</td>
                      <td className="py-3 pr-3">{v.tipo === "VAN" ? "Van" : "Ônibus"}</td>
                      <td className="py-3 pr-3">{v.capacidade} lugares</td>
                      <td className="py-3 pr-3"><SeloStatus ativo={v.ativo} /></td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <BotaoAdmin
                            variante="texto"
                            onClick={() => {
                              setEditandoId(v.id);
                              setEdicao(paraForm(v));
                            }}
                          >
                            Editar
                          </BotaoAdmin>
                          <BotaoAdmin
                            variante={v.ativo ? "perigo" : "secundario"}
                            carregando={executando === `salvar${v.id}`}
                            onClick={() =>
                              salvar(v.id, { ...paraForm(v), ativo: !v.ativo }, v.ativo ? `${v.nome} desativado.` : `${v.nome} reativado.`)
                            }
                          >
                            {v.ativo ? "Desativar" : "Reativar"}
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
    </div>
  );
}
