import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, EVENTO_SESSAO_EXPIRADA } from "./api";
import { limparSessao, obterToken, salvarSessao, usuarioSalvo } from "./sessao";
import type { Perfil, Usuario } from "./tipos";

interface RespostaAuth {
  token: string;
  usuario: Usuario;
}

interface ContextoAuth {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string, perfil: Perfil) => Promise<Usuario>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<Usuario>;
  sair: () => void;
}

const Contexto = createContext<ContextoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => (obterToken() ? usuarioSalvo() : null));
  const [carregando, setCarregando] = useState<boolean>(() => obterToken() !== null);

  // Confirma no servidor se o token salvo ainda vale
  useEffect(() => {
    if (!obterToken()) return;
    api
      .get<Usuario>("/auth/me")
      .then(setUsuario)
      .catch(() => {
        limparSessao();
        setUsuario(null);
      })
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    const aoExpirar = () => setUsuario(null);
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
  }, []);

  const entrar = useCallback(async (email: string, senha: string, perfil: Perfil) => {
    const resposta = await api.post<RespostaAuth>("/auth/login", { email, senha, perfil });
    salvarSessao(resposta.token, resposta.usuario);
    setUsuario(resposta.usuario);
    return resposta.usuario;
  }, []);

  const cadastrar = useCallback(async (nome: string, email: string, senha: string) => {
    const resposta = await api.post<RespostaAuth>("/auth/cadastro", { nome, email, senha });
    salvarSessao(resposta.token, resposta.usuario);
    setUsuario(resposta.usuario);
    return resposta.usuario;
  }, []);

  const sair = useCallback(() => {
    limparSessao();
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, carregando, entrar, cadastrar, sair }),
    [usuario, carregando, entrar, cadastrar, sair],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth(): ContextoAuth {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return contexto;
}

export function rotaInicial(perfil: Perfil): string {
  if (perfil === "MOTORISTA") return "/motorista/viagem";
  if (perfil === "ADMIN") return "/admin";
  return "/aluno/mapa";
}
