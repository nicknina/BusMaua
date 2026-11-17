import { limparSessao, obterToken } from "./sessao";

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export const EVENTO_SESSAO_EXPIRADA = "busmaua:sessao-expirada";

export class ApiErro extends Error {
  constructor(
    mensagem: string,
    public readonly status: number,
  ) {
    super(mensagem);
  }
}

type Metodo = "GET" | "POST" | "PUT" | "DELETE";

async function requisicao<T>(metodo: Metodo, caminho: string, corpo?: unknown): Promise<T> {
  const token = obterToken();
  const headers: Record<string, string> = {};
  if (corpo !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}/api${caminho}`, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ApiErro("Sem conexão com o servidor. Verifique sua internet.", 0);
  }

  if (resposta.status === 401 && token) {
    limparSessao();
    window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
  }

  if (!resposta.ok) {
    let mensagem = "Algo deu errado. Tente novamente.";
    try {
      const json = await resposta.json();
      if (json?.mensagem) mensagem = json.mensagem;
    } catch {
      // resposta sem corpo
    }
    if (resposta.status === 401) mensagem = "Sua sessão expirou. Entre novamente.";
    throw new ApiErro(mensagem, resposta.status);
  }

  if (resposta.status === 204) return null as T;
  const texto = await resposta.text();
  return (texto ? JSON.parse(texto) : null) as T;
}

export const api = {
  get: <T>(caminho: string) => requisicao<T>("GET", caminho),
  post: <T>(caminho: string, corpo: unknown = {}) => requisicao<T>("POST", caminho, corpo),
  delete: <T>(caminho: string) => requisicao<T>("DELETE", caminho),
};

export function mensagemDeErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : "Algo deu errado. Tente novamente.";
}
