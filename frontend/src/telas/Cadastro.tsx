import { Lock, Mail, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Alerta, Botao } from "../components/ui";
import { mensagemDeErro } from "../lib/api";
import { rotaInicial, useAuth } from "../lib/auth";
import { CampoTexto, Logotipo } from "./componentesAcesso";

export function Cadastro() {
  const { usuario, cadastrar } = useAuth();
  const navegar = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={rotaInicial(usuario.perfil)} replace />;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!email.trim().toLowerCase().endsWith("@maua.br")) {
      setErro("Use seu e-mail institucional (@maua.br).");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      setErro("As senhas não conferem.");
      return;
    }
    setEnviando(true);
    try {
      const novo = await cadastrar(nome.trim(), email.trim(), senha);
      navegar(rotaInicial(novo.perfil), { replace: true });
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[440px] flex-col bg-fundo px-6 pb-8 pt-10">
      <Logotipo />
      <h2 className="mt-8 text-xl font-bold">Criar conta de aluno</h2>

      <form onSubmit={enviar} className="mt-4 flex flex-col gap-4">
        <CampoTexto
          rotulo="Nome completo"
          icone={<User className="h-5 w-5" />}
          autoComplete="name"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <CampoTexto
          rotulo="E-mail institucional"
          icone={<Mail className="h-5 w-5" />}
          type="email"
          autoComplete="email"
          placeholder="nome.sobrenome@maua.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <CampoTexto
          rotulo="Senha"
          icone={<Lock className="h-5 w-5" />}
          type="password"
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <CampoTexto
          rotulo="Confirmar senha"
          icone={<Lock className="h-5 w-5" />}
          type="password"
          autoComplete="new-password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          required
        />

        <label className="flex items-start gap-3 text-sm text-cinza">
          <input
            type="checkbox"
            checked={aceite}
            onChange={(e) => setAceite(e.target.checked)}
            className="mt-0.5 h-5 w-5 accent-azul"
            required
          />
          <span>
            Concordo com o uso dos meus dados (nome, e-mail e registros de embarque) apenas para organizar o
            transporte universitário, conforme a LGPD.
          </span>
        </label>

        {erro && <Alerta tipo="erro">{erro}</Alerta>}

        <Botao type="submit" carregando={enviando} disabled={!aceite}>
          Criar conta
        </Botao>
      </form>

      <p className="mt-auto pt-8 text-center text-cinza">
        Já tem conta?{" "}
        <Link to="/login" className="font-bold text-azul">
          Entrar
        </Link>
      </p>
    </div>
  );
}
