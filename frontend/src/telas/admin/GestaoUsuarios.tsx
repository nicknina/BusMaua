import { KeyRound, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Carregando } from "../../components/ui";
import { api } from "../../lib/api";
import type { UsuarioAdmin } from "../../lib/tipos";
import { BotaoAdmin, Campo, Mensagem, Secao, SeloStatus, useAcao } from "./componentesAdmin";

export function GestaoUsuarios() {
  const [motoristas, setMotoristas] = useState<UsuarioAdmin[] | null>(null);
  const [novo, setNovo] = useState({ nome: "", email: "", senha: "" });
  const [senha, setSenha] = useState({ email: "", novaSenha: "" });
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");
  const { executar, executando, erro, sucesso } = useAcao();

  useEffect(() => {
    executar("carregar", () => api.get<UsuarioAdmin[]>("/admin/motoristas").then(setMotoristas));
  }, [executar]);

  function substituir(atualizado: UsuarioAdmin) {
    setMotoristas((lista) => lista?.map((m) => (m.id === atualizado.id ? atualizado : m)) ?? null);
  }

  async function criar() {
    const criado = await executar(
      "criar",
      () => api.post<UsuarioAdmin>("/admin/motoristas", { ...novo, nome: novo.nome.trim(), email: novo.email.trim() }),
      "Conta de motorista criada. Passe o e-mail e a senha inicial para ele.",
    );
    if (criado) {
      setMotoristas((lista) => [...(lista ?? []), criado].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNovo({ nome: "", email: "", senha: "" });
    }
  }

  async function editar(m: UsuarioAdmin, nome: string, ativo: boolean, mensagem: string) {
    const atualizado = await executar(`editar${m.id}`, () => api.put<UsuarioAdmin>(`/admin/usuarios/${m.id}`, { nome, ativo }), mensagem);
    if (atualizado) {
      substituir(atualizado);
      setEditandoId(null);
    }
  }

  async function redefinir() {
    const conta = await executar(
      "senha",
      () => api.post<UsuarioAdmin>("/admin/usuarios/redefinir-senha", { email: senha.email.trim(), novaSenha: senha.novaSenha }),
      `Senha de ${senha.email.trim()} redefinida.`,
    );
    if (conta) setSenha({ email: "", novaSenha: "" });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Secao titulo="Novo motorista" descricao="Motoristas não se cadastram pelo app: a conta é criada aqui.">
          <div className="flex flex-col gap-3">
            <Campo rotulo="Nome completo" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
            <Campo rotulo="E-mail" type="email" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} />
            <Campo rotulo="Senha inicial (mín. 6 caracteres)" type="text" value={novo.senha} onChange={(e) => setNovo({ ...novo, senha: e.target.value })} />
            <BotaoAdmin
              carregando={executando === "criar"}
              disabled={!novo.nome.trim() || !novo.email.trim() || novo.senha.length < 6}
              onClick={criar}
              className="self-start"
            >
              <UserPlus className="h-4 w-4" /> Criar conta
            </BotaoAdmin>
          </div>
        </Secao>

        <Secao titulo="Redefinir senha" descricao="Para alunos ou motoristas que esqueceram a senha e procuraram a administração.">
          <div className="flex flex-col gap-3">
            <Campo rotulo="E-mail da conta" type="email" value={senha.email} onChange={(e) => setSenha({ ...senha, email: e.target.value })} />
            <Campo rotulo="Nova senha (mín. 6 caracteres)" type="text" value={senha.novaSenha} onChange={(e) => setSenha({ ...senha, novaSenha: e.target.value })} />
            <BotaoAdmin
              variante="secundario"
              carregando={executando === "senha"}
              disabled={!senha.email.trim() || senha.novaSenha.length < 6}
              onClick={redefinir}
              className="self-start"
            >
              <KeyRound className="h-4 w-4" /> Redefinir senha
            </BotaoAdmin>
          </div>
        </Secao>
      </div>

      <Mensagem erro={erro} sucesso={sucesso} />

      <Secao titulo="Motoristas" descricao="Contas desativadas não conseguem entrar no app.">
        {!motoristas ? (
          <Carregando />
        ) : motoristas.length === 0 ? (
          <p className="text-sm text-cinza">Nenhum motorista cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-cinza">
                <tr className="border-b border-cinza-linha">
                  <th className="py-2 pr-3 font-medium">Nome</th>
                  <th className="py-2 pr-3 font-medium">E-mail</th>
                  <th className="py-2 pr-3 font-medium">Situação</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {motoristas.map((m) => (
                  <tr key={m.id} className="border-b border-cinza-linha/60 last:border-0">
                    <td className="py-3 pr-3 font-semibold">
                      {editandoId === m.id ? <Campo value={nomeEdicao} onChange={(e) => setNomeEdicao(e.target.value)} /> : m.nome}
                    </td>
                    <td className="py-3 pr-3">{m.email}</td>
                    <td className="py-3 pr-3"><SeloStatus ativo={m.ativo} /></td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {editandoId === m.id ? (
                          <>
                            <BotaoAdmin
                              carregando={executando === `editar${m.id}`}
                              disabled={!nomeEdicao.trim()}
                              onClick={() => editar(m, nomeEdicao.trim(), m.ativo, "Nome atualizado.")}
                            >
                              Salvar
                            </BotaoAdmin>
                            <BotaoAdmin variante="texto" onClick={() => setEditandoId(null)}>Cancelar</BotaoAdmin>
                          </>
                        ) : (
                          <>
                            <BotaoAdmin
                              variante="texto"
                              onClick={() => {
                                setEditandoId(m.id);
                                setNomeEdicao(m.nome);
                              }}
                            >
                              Editar
                            </BotaoAdmin>
                            <BotaoAdmin
                              variante={m.ativo ? "perigo" : "secundario"}
                              carregando={executando === `editar${m.id}`}
                              onClick={() => editar(m, m.nome, !m.ativo, m.ativo ? `${m.nome} desativado.` : `${m.nome} reativado.`)}
                            >
                              {m.ativo ? "Desativar" : "Reativar"}
                            </BotaoAdmin>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Secao>
    </div>
  );
}
