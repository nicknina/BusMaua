import { BarChart3, Bus, Clock, LogOut, Route, UserCog } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { classes } from "../../components/ui";
import { useAuth } from "../../lib/auth";
import { GestaoHorarios } from "./GestaoHorarios";
import { GestaoLinhas } from "./GestaoLinhas";
import { GestaoUsuarios } from "./GestaoUsuarios";
import { GestaoVeiculos } from "./GestaoVeiculos";
import { VisaoGeral } from "./VisaoGeral";

type Aba = "visao" | "horarios" | "veiculos" | "linhas" | "usuarios";

const ABAS: { id: Aba; rotulo: string; icone: ReactNode }[] = [
  { id: "visao", rotulo: "Visão geral", icone: <BarChart3 className="h-4 w-4" /> },
  { id: "horarios", rotulo: "Horários", icone: <Clock className="h-4 w-4" /> },
  { id: "veiculos", rotulo: "Veículos", icone: <Bus className="h-4 w-4" /> },
  { id: "linhas", rotulo: "Linhas e paradas", icone: <Route className="h-4 w-4" /> },
  { id: "usuarios", rotulo: "Motoristas e contas", icone: <UserCog className="h-4 w-4" /> },
];

/**
 * Interface administrativa: acompanhamento da operação e cadastros
 * (horários, frota, linhas/paradas e contas de motoristas).
 */
export function PainelAdmin() {
  const { usuario, sair } = useAuth();
  const navegar = useNavigate();
  const [aba, setAba] = useState<Aba>("visao");

  return (
    <div className="min-h-dvh bg-fundo">
      <header className="bg-azul-escuro text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-5">
          <div>
            <h1 className="text-2xl font-bold">BusMauá · Gestão do transporte</h1>
            <p className="text-sm text-white/75">{usuario?.nome}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              sair();
              navegar("/login", { replace: true });
            }}
            className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 pt-4" role="tablist">
          {ABAS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={aba === a.id}
              onClick={() => setAba(a.id)}
              className={classes(
                "flex shrink-0 items-center gap-2 rounded-t-2xl px-4 py-2.5 text-sm font-semibold transition",
                aba === a.id ? "bg-fundo text-azul-escuro" : "text-white/80 hover:bg-white/10",
              )}
            >
              {a.icone}
              {a.rotulo}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        {aba === "visao" && <VisaoGeral />}
        {aba === "horarios" && <GestaoHorarios />}
        {aba === "veiculos" && <GestaoVeiculos />}
        {aba === "linhas" && <GestaoLinhas />}
        {aba === "usuarios" && <GestaoUsuarios />}
      </main>
    </div>
  );
}
