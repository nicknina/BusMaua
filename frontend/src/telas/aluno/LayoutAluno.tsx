import { Clock, Map as IconeMapa, User, Users } from "lucide-react";
import { Outlet } from "react-router-dom";
import { BarraNavegacao } from "../../components/BarraNavegacao";

const itens = [
  { para: "/aluno/mapa", rotulo: "Mapa", icone: IconeMapa },
  { para: "/aluno/fila", rotulo: "Fila", icone: Users },
  { para: "/aluno/horarios", rotulo: "Horários", icone: Clock },
  { para: "/aluno/perfil", rotulo: "Perfil", icone: User },
];

export function LayoutAluno() {
  return (
    <div className="mx-auto min-h-dvh max-w-[440px] bg-fundo pb-[96px]">
      <Outlet />
      <BarraNavegacao itens={itens} />
    </div>
  );
}
