import { Radio, User, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import { BarraNavegacao } from "../../components/BarraNavegacao";
import { api } from "../../lib/api";
import { useEnvioGps, type EstadoGps } from "../../lib/gps";
import { useIntervalo, useLinhas } from "../../lib/hooks";
import { assinar } from "../../lib/tempoReal";
import type { Linha, Parada, Viagem } from "../../lib/tipos";

const itens = [
  { para: "/motorista/viagem", rotulo: "Viagem", icone: Radio },
  { para: "/motorista/passageiros", rotulo: "Passageiros", icone: Users },
  { para: "/motorista/perfil", rotulo: "Perfil", icone: User },
];

export interface ContextoMotorista {
  /** undefined = carregando; null = sem viagem em andamento */
  viagem: Viagem | null | undefined;
  definirViagem: (v: Viagem | null) => void;
  recarregar: () => void;
  linhas: Linha[] | null;
  rota: Parada[] | null;
  gps: EstadoGps;
}

export function useMotorista() {
  return useOutletContext<ContextoMotorista>();
}

/**
 * Mantém a viagem do motorista e o envio de GPS no layout, para que o
 * compartilhamento continue quando ele troca de aba (Viagem ↔ Passageiros).
 */
export function LayoutMotorista() {
  const [viagem, setViagem] = useState<Viagem | null | undefined>(undefined);
  const { linhas } = useLinhas();

  const recarregar = useCallback(() => {
    api
      .get<Viagem | null>("/motorista/viagens/atual")
      .then(setViagem)
      .catch(() => setViagem((atual) => atual ?? null));
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const viagemId = viagem?.id;
  useEffect(() => {
    if (!viagemId) return;
    return assinar<Viagem>("/topic/frota", (v) => {
      if (v.id !== viagemId) return;
      setViagem(v.status === "ENCERRADA" ? null : v);
    });
  }, [viagemId]);

  useIntervalo(recarregar, 60_000);

  const rota = linhas?.find((l) => l.id === viagem?.linhaId)?.paradas ?? null;
  const gps = useEnvioGps(viagem, rota, setViagem);

  const contexto: ContextoMotorista = { viagem, definirViagem: setViagem, recarregar, linhas, rota, gps };

  return (
    <div className="mx-auto min-h-dvh max-w-[440px] bg-fundo pb-[96px]">
      <Outlet context={contexto} />
      <BarraNavegacao itens={itens} />
    </div>
  );
}
