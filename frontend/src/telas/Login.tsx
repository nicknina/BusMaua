import { Bus, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Alerta, Botao, Segmentado } from "../components/ui";
import { mensagemDeErro } from "../lib/api";
import { rotaInicial, useAuth } from "../lib/auth";
import type { Perfil } from "../lib/tipos";
import { CampoTexto, Logotipo } from "./componentesAcesso";

export function Login() {
  const { usuario, entrar } = useAuth();
  const navegar = useNavigate();
  const [perfil, setPerfil] = useState<Perfil>("ALUNO");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [ajudaSenha, setAjudaSenha] = useState(false);

  if (usuario) return <Navigate to={rotaInicial(usuario.perfil)} replace />;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const logado = await entrar(email.trim(), senha, perfil);
      navegar(rotaInicial(logado.perfil), { replace: true });
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[440px] flex-col bg-fundo px-6 pb-8 pt-12">
      <Logotipo />

      <form onSubmit={enviar} className="mt-8 flex flex-col gap-4">
        <Segmentado<Perfil>
          valor={perfil}
          aoMudar={setPerfil}
          opcoes={[
            { valor: "ALUNO", rotulo: <><User className="h-5 w-5" /> Aluno</> },
            { valor: "MOTORISTA", rotulo: <><Bus className="h-5 w-5" /> Motorista</> },
          ]}
        />

        <CampoTexto
          rotulo={perfil === "ALUNO" ? "E-mail institucional" : "E-mail"}
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
          autoComplete="current-password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <button
          type="button"
          onClick={() => setAjudaSenha((v) => !v)}
          className="-mt-1 self-end text-sm font-semibold text-azul"
        >
          Esqueci minha senha
        </button>
        {ajudaSenha && (
          <Alerta tipo="info">
            Procure a administração do transporte do Instituto Mauá: ela pode redefinir a sua senha.
          </Alerta>
        )}

        {erro && <Alerta tipo="erro">{erro}</Alerta>}

        <Botao type="submit" carregando={enviando} className="mt-1 uppercase tracking-wide">
          Entrar
        </Botao>

        <Alerta tipo="info" icone={<ShieldCheck className="h-5 w-5 text-azul" />}>
          Motoristas acessam com credenciais liberadas pela administração do Instituto Mauá.
        </Alerta>
      </form>

      <p className="mt-auto pt-10 text-center text-cinza">
        Não tem conta?{" "}
        <Link to="/cadastro" className="font-bold text-azul">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
