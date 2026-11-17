import { Bus } from "lucide-react";
import { useId, type InputHTMLAttributes, type ReactNode } from "react";

export function Logotipo() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-azul text-white shadow-botao">
        <Bus className="h-11 w-11" strokeWidth={1.8} />
      </div>
      <h1 className="mt-3 text-5xl font-extrabold tracking-tight text-azul">BUSMAUÁ</h1>
      <p className="mt-1 text-cinza">Seu transporte universitário em tempo real</p>
    </div>
  );
}

interface PropsCampo extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
  icone: ReactNode;
}

export function CampoTexto({ rotulo, icone, ...input }: PropsCampo) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-tinta">
        {rotulo}
      </label>
      <div className="flex h-14 items-center gap-3 rounded-2xl border border-cinza-linha bg-white px-4 text-cinza focus-within:border-azul">
        {icone}
        <input
          id={id}
          {...input}
          className="h-full min-w-0 flex-1 bg-transparent text-base text-tinta outline-none placeholder:text-cinza-claro"
        />
      </div>
    </div>
  );
}
