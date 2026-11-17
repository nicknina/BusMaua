import type { Usuario } from "./tipos";

const CHAVE_TOKEN = "busmaua:token";
const CHAVE_USUARIO = "busmaua:usuario";

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(chave);
    else localStorage.setItem(chave, valor);
  } catch {
    // navegação privada sem armazenamento: a sessão dura só enquanto a aba estiver aberta
  }
}

let tokenEmMemoria: string | null = ler(CHAVE_TOKEN);

export function obterToken(): string | null {
  return tokenEmMemoria;
}

export function salvarSessao(token: string, usuario: Usuario) {
  tokenEmMemoria = token;
  gravar(CHAVE_TOKEN, token);
  gravar(CHAVE_USUARIO, JSON.stringify(usuario));
}

export function usuarioSalvo(): Usuario | null {
  const bruto = ler(CHAVE_USUARIO);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as Usuario;
  } catch {
    return null;
  }
}

export function limparSessao() {
  tokenEmMemoria = null;
  gravar(CHAVE_TOKEN, null);
  gravar(CHAVE_USUARIO, null);
}

/** Preferências pequenas do app (ex.: até quando as notificações foram vistas). */
export const preferencias = {
  ler(chave: string): string | null {
    return ler(`busmaua:${chave}`);
  },
  gravar(chave: string, valor: string) {
    gravar(`busmaua:${chave}`, valor);
  },
};
