import { Client, type StompSubscription } from "@stomp/stompjs";

/**
 * Conexão única (STOMP sobre WebSocket) compartilhada pelo app inteiro.
 * As telas assinam tópicos com `assinar` e recebem o JSON já convertido.
 */

type Ouvinte = (conteudo: unknown) => void;

const ouvintes = new Map<string, Set<Ouvinte>>();
const inscricoes = new Map<string, StompSubscription>();
let cliente: Client | null = null;

function enderecoWs(): string {
  const configurado = import.meta.env.VITE_WS_URL as string | undefined;
  if (configurado) return configurado;
  const protocolo = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocolo}://${window.location.host}/ws`;
}

function conectar(): Client {
  if (cliente) return cliente;
  cliente = new Client({
    brokerURL: enderecoWs(),
    reconnectDelay: 4000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      inscricoes.clear();
      for (const destino of ouvintes.keys()) inscrever(destino);
    },
  });
  cliente.activate();
  return cliente;
}

function inscrever(destino: string) {
  if (!cliente?.connected || inscricoes.has(destino)) return;
  const inscricao = cliente.subscribe(destino, (mensagem) => {
    let conteudo: unknown;
    try {
      conteudo = JSON.parse(mensagem.body);
    } catch {
      return;
    }
    ouvintes.get(destino)?.forEach((ouvinte) => ouvinte(conteudo));
  });
  inscricoes.set(destino, inscricao);
}

/** Assina um tópico. Retorna a função para cancelar a assinatura. */
export function assinar<T>(destino: string, ouvinte: (conteudo: T) => void): () => void {
  conectar();
  let lista = ouvintes.get(destino);
  if (!lista) {
    lista = new Set();
    ouvintes.set(destino, lista);
  }
  const funcao = ouvinte as Ouvinte;
  lista.add(funcao);
  inscrever(destino);

  return () => {
    const atual = ouvintes.get(destino);
    if (!atual) return;
    atual.delete(funcao);
    if (atual.size === 0) {
      ouvintes.delete(destino);
      try {
        inscricoes.get(destino)?.unsubscribe();
      } catch {
        // conexão já fechada
      }
      inscricoes.delete(destino);
    }
  };
}
