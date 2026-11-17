import type { Viagem } from "./tipos";

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

export function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** "18:36" para hoje, "Ontem" ou "12/11" para dias anteriores. */
export function quando(iso: string): string {
  const data = new Date(iso);
  const hoje = new Date();
  const mesmoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (mesmoDia(data, hoje)) return hora(iso);
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  if (mesmoDia(data, ontem)) return "Ontem";
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/** Soma minutos a um horário "HH:mm". */
export function somarMinutos(hhmm: string, minutos: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h * 60 + m + minutos + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function minutosDoDia(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minutosAgora(): number {
  const agora = new Date();
  return agora.getHours() * 60 + agora.getMinutes();
}

/** "Mauá → Estação São Caetano" vira "Mauá → Estação" no seletor de sentido. */
export function nomeCurtoLinha(nome: string): string {
  return nome
    .split("→")
    .map((parte) => parte.trim().split(/\s+/)[0])
    .join(" → ");
}

export function rotuloStatus(v: Viagem): { texto: string; cor: "verde" | "ambar" | "cinza" | "azul" } {
  switch (v.status) {
    case "EM_ANDAMENTO":
      return { texto: "Em rota", cor: "verde" };
    case "PAUSADA":
      return { texto: "Pausada", cor: "ambar" };
    case "ENCERRADA":
      return { texto: "Encerrada", cor: "cinza" };
    default:
      return v.atrasoMinutos > 0
        ? { texto: `Atraso de ${v.atrasoMinutos} min`, cor: "ambar" }
        : { texto: "Agendada", cor: "azul" };
  }
}

/** Cor do indicador de lotação: verde até 70%, âmbar até 90%, vermelho acima. */
export function corLotacao(lotacao: number, capacidade: number): string {
  if (capacidade <= 0) return "bg-cinza-claro";
  const taxa = lotacao / capacidade;
  if (taxa < 0.7) return "bg-verde";
  if (taxa < 0.9) return "bg-ambar";
  return "bg-vermelho";
}

export function ordinal(n: number): string {
  return `${n}º`;
}
