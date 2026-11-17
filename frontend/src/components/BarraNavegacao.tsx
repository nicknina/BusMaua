import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { classes } from "./ui";

export interface ItemNavegacao {
  para: string;
  rotulo: string;
  icone: LucideIcon;
}

export function BarraNavegacao({ itens }: { itens: ItemNavegacao[] }) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-[1000] w-full max-w-[440px] -translate-x-1/2 border-t border-cinza-linha bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex">
        {itens.map(({ para, rotulo, icone: Icone }) => (
          <li key={para} className="flex-1">
            <NavLink
              to={para}
              className={({ isActive }) =>
                classes(
                  "flex h-[72px] flex-col items-center justify-center gap-1 text-sm",
                  isActive ? "font-semibold text-azul" : "text-cinza-claro",
                )
              }
            >
              <Icone className="h-6 w-6" strokeWidth={1.8} />
              {rotulo}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
