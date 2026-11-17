import { ChevronLeft, Loader2, ShieldCheck } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

export function classes(...lista: (string | false | null | undefined)[]) {
  return lista.filter(Boolean).join(" ");
}

// ------------------------------------------------------------------ botões

type Variante = "primario" | "sucesso" | "perigo" | "contorno" | "contornoPerigo" | "aviso";

const estilosBotao: Record<Variante, string> = {
  primario: "bg-azul text-white shadow-botao active:bg-azul-escuro",
  sucesso: "bg-verde text-white active:brightness-95",
  perigo: "bg-vermelho text-white active:brightness-95",
  contorno: "bg-white text-azul border-2 border-azul",
  contornoPerigo: "bg-white text-vermelho border border-vermelho/40",
  aviso: "bg-ambar-claro text-ambar-escuro",
};

interface PropsBotao extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  carregando?: boolean;
  icone?: ReactNode;
  tamanho?: "grande" | "medio";
}

export function Botao({
  variante = "primario",
  carregando,
  icone,
  tamanho = "grande",
  className,
  children,
  disabled,
  ...resto
}: PropsBotao) {
  return (
    <button
      {...resto}
      disabled={disabled || carregando}
      className={classes(
        "flex w-full items-center justify-center gap-3 rounded-full font-semibold transition disabled:opacity-60",
        tamanho === "grande" ? "h-14 text-lg" : "h-12 text-base",
        estilosBotao[variante],
        className,
      )}
    >
      {carregando ? <Loader2 className="h-5 w-5 animate-spin" /> : icone}
      {children}
    </button>
  );
}

// ------------------------------------------------------------------ blocos

export function Cartao({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={classes("rounded-3xl bg-white p-4 shadow-cartao", className)}>{children}</div>;
}

export function Indicador({ rotulo, valor, sufixo }: { rotulo: string; valor: ReactNode; sufixo?: string }) {
  return (
    <div className="min-w-0 flex-1 rounded-2xl bg-white px-3 py-2 shadow-cartao">
      <div className="truncate text-xs text-cinza">{rotulo}</div>
      <div className="truncate text-2xl font-bold leading-tight text-tinta">
        {valor}
        {sufixo && <span className="ml-1 text-sm font-medium text-cinza">{sufixo}</span>}
      </div>
    </div>
  );
}

export function BarraProgresso({ valor, maximo, className }: { valor: number; maximo: number; className?: string }) {
  const pct = maximo > 0 ? Math.min(100, Math.round((valor / maximo) * 100)) : 0;
  return (
    <div className={classes("h-2 w-full overflow-hidden rounded-full bg-cinza-linha", className)}>
      <div className="h-full rounded-full bg-azul transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

interface OpcaoSegmentada<T extends string | number> {
  valor: T;
  rotulo: ReactNode;
}

export function Segmentado<T extends string | number>({
  opcoes,
  valor,
  aoMudar,
}: {
  opcoes: OpcaoSegmentada<T>[];
  valor: T;
  aoMudar: (v: T) => void;
}) {
  return (
    <div className="flex rounded-full bg-white p-1 shadow-cartao" role="tablist">
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="tab"
          aria-selected={o.valor === valor}
          onClick={() => aoMudar(o.valor)}
          className={classes(
            "flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-base font-semibold transition",
            o.valor === valor ? "bg-azul text-white" : "text-cinza",
          )}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

const coresSelo = {
  verde: "bg-verde-claro text-verde",
  ambar: "bg-ambar-claro text-ambar-escuro",
  azul: "bg-azul-claro text-azul",
  cinza: "bg-cinza-linha text-cinza",
  vermelho: "bg-vermelho-claro text-vermelho",
  branco: "bg-white text-azul",
};

export function Selo({
  cor = "azul",
  icone,
  children,
  className,
}: {
  cor?: keyof typeof coresSelo;
  icone?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={classes(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold",
        coresSelo[cor],
        className,
      )}
    >
      {icone}
      {children}
    </span>
  );
}

export function Alerta({
  tipo = "info",
  icone,
  children,
}: {
  tipo?: "info" | "aviso" | "erro" | "sucesso";
  icone?: ReactNode;
  children: ReactNode;
}) {
  const estilos = {
    info: "bg-azul-claro text-tinta",
    aviso: "bg-ambar-claro text-tinta",
    erro: "bg-vermelho-claro text-vermelho",
    sucesso: "bg-verde-claro text-verde",
  };
  return (
    <div className={classes("flex items-start gap-3 rounded-2xl px-4 py-3 text-sm leading-snug", estilos[tipo])} role="status">
      {icone && <span className="mt-0.5 shrink-0">{icone}</span>}
      <div>{children}</div>
    </div>
  );
}

// ------------------------------------------------------------------ cabeçalhos

export function CabecalhoTela({
  titulo,
  subtitulo,
  voltar = true,
  direita,
}: {
  titulo: string;
  subtitulo?: string;
  voltar?: boolean;
  direita?: ReactNode;
}) {
  const navegar = useNavigate();
  return (
    <header className="flex items-center gap-3 px-5 pb-4 pt-6">
      {voltar && (
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => (window.history.length > 1 ? navegar(-1) : navegar("/"))}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-cartao"
        >
          <ChevronLeft className="h-6 w-6 text-tinta" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-bold leading-tight text-tinta">{titulo}</h1>
        {subtitulo && <p className="truncate text-sm text-cinza">{subtitulo}</p>}
      </div>
      {direita}
    </header>
  );
}

export function CabecalhoMotorista({
  titulo,
  subtitulo,
  selo = true,
  direita,
}: {
  titulo: string;
  subtitulo?: string;
  selo?: boolean;
  direita?: ReactNode;
}) {
  return (
    <header className="rounded-b-[2rem] bg-azul-escuro px-5 pb-6 pt-6 text-white">
      {selo && (
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wider text-azul-medio">
          <ShieldCheck className="h-4 w-4" /> ÁREA DO MOTORISTA
        </span>
      )}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold leading-tight">{titulo}</h1>
          {subtitulo && <p className="truncate text-sm text-white/75">{subtitulo}</p>}
        </div>
        {direita}
      </div>
    </header>
  );
}

// ------------------------------------------------------------------ estados

export function Carregando({ texto = "Carregando..." }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-cinza">
      <Loader2 className="h-5 w-5 animate-spin" /> {texto}
    </div>
  );
}

export function Vazio({ icone, titulo, children }: { icone?: ReactNode; titulo: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      {icone && <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-azul-claro text-azul">{icone}</div>}
      <p className="text-lg font-semibold text-tinta">{titulo}</p>
      {children && <div className="text-sm text-cinza">{children}</div>}
    </div>
  );
}

export function Interruptor({
  ligado,
  aoMudar,
  rotulo,
  desabilitado,
}: {
  ligado: boolean;
  aoMudar: (v: boolean) => void;
  rotulo: string;
  desabilitado?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      disabled={desabilitado}
      onClick={() => aoMudar(!ligado)}
      className={classes(
        "relative h-9 w-16 shrink-0 rounded-full transition disabled:opacity-60",
        ligado ? "bg-verde" : "bg-white/30",
      )}
    >
      <span
        className={classes(
          "absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all",
          ligado ? "left-8" : "left-1",
        )}
      />
    </button>
  );
}
