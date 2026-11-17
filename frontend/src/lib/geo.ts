import type { Parada, Viagem } from "./tipos";

export interface Ponto {
  lat: number;
  lng: number;
}

const RAIO_TERRA_M = 6_371_000;
const FATOR_RUAS = 1.3;
const VELOCIDADE_MEDIA_KMH = 18;

export function distanciaMetros(a: Ponto, b: Ponto): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return RAIO_TERRA_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Mesma estimativa usada no backend (distância × fator de ruas ÷ velocidade). */
export function minutosAte(origem: Ponto, destino: Ponto, velocidadeKmh?: number | null): number {
  const metros = distanciaMetros(origem, destino) * FATOR_RUAS;
  const velocidade = !velocidadeKmh || velocidadeKmh < VELOCIDADE_MEDIA_KMH ? VELOCIDADE_MEDIA_KMH : velocidadeKmh;
  return Math.ceil((metros / 1000 / velocidade) * 60);
}

export function pontoDaParada(p: Parada): Ponto {
  return { lat: p.latitude, lng: p.longitude };
}

export function posicaoDaViagem(v: Viagem): Ponto | null {
  return v.latitude != null && v.longitude != null ? { lat: v.latitude, lng: v.longitude } : null;
}

export function paradaMaisProxima(paradas: Parada[], ponto: Ponto | null): Parada | null {
  if (paradas.length === 0) return null;
  if (!ponto) return paradas[0];
  return paradas.reduce((melhor, p) =>
    distanciaMetros(ponto, pontoDaParada(p)) < distanciaMetros(ponto, pontoDaParada(melhor)) ? p : melhor,
  );
}

/** Minutos até a viagem chegar a uma parada: GPS se estiver na rua, senão a grade. */
export function minutosAteParada(viagem: Viagem, parada: Parada): number | null {
  if (viagem.status === "ENCERRADA") return null;
  const posicao = posicaoDaViagem(viagem);
  if ((viagem.status === "EM_ANDAMENTO" || viagem.status === "PAUSADA") && posicao) {
    return minutosAte(posicao, pontoDaParada(parada), viagem.velocidadeKmh);
  }
  if (viagem.minutosParaSaida != null) return viagem.minutosParaSaida + parada.minutosDesdeSaida;
  return null;
}
