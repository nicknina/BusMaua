import { CheckCircle2, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { classes } from "../../components/ui";
import { mensagemDeErro } from "../../lib/api";

/** Bloco branco das telas de gestão. */
export function Secao({ titulo, descricao, acoes, children }: { titulo: string; descricao?: string; acoes?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-cartao">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{titulo}</h2>
          {descricao && <p className="text-sm text-cinza">{descricao}</p>}
        </div>
        {acoes}
      </div>
      {children}
    </section>
  );
}

const estiloCampo =
  "h-10 w-full rounded-xl border border-cinza-linha bg-white px-3 text-sm text-tinta outline-none focus:border-azul disabled:bg-fundo";

export function Campo({ rotulo, className, ...input }: InputHTMLAttributes<HTMLInputElement> & { rotulo?: string }) {
  const campo = <input {...input} className={classes(estiloCampo, className)} />;
  if (!rotulo) return campo;
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-cinza">
      {rotulo}
      {campo}
    </label>
  );
}

export function Selecao({
  rotulo,
  className,
  children,
  ...select
}: SelectHTMLAttributes<HTMLSelectElement> & { rotulo?: string; children: ReactNode }) {
  const campo = (
    <select {...select} className={classes(estiloCampo, className)}>
      {children}
    </select>
  );
  if (!rotulo) return campo;
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-cinza">
      {rotulo}
      {campo}
    </label>
  );
}

type VarianteBotao = "primario" | "secundario" | "perigo" | "texto";

export function BotaoAdmin({
  variante = "primario",
  carregando,
  className,
  children,
  disabled,
  ...resto
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: VarianteBotao; carregando?: boolean }) {
  const estilos: Record<VarianteBotao, string> = {
    primario: "bg-azul text-white",
    secundario: "bg-azul-claro text-azul",
    perigo: "bg-vermelho-claro text-vermelho",
    texto: "text-azul hover:bg-azul-claro",
  };
  return (
    <button
      type="button"
      {...resto}
      disabled={disabled || carregando}
      className={classes(
        "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition disabled:opacity-50",
        estilos[variante],
        className,
      )}
    >
      {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function SeloStatus({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={classes(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
        ativo ? "bg-verde-claro text-verde" : "bg-cinza-linha text-cinza",
      )}
    >
      {ativo ? "Ativo" : "Inativo"}
    </span>
  );
}

export function Mensagem({ erro, sucesso }: { erro: string | null; sucesso: string | null }) {
  if (erro) return <p className="rounded-xl bg-vermelho-claro px-3 py-2 text-sm text-vermelho">{erro}</p>;
  if (sucesso)
    return (
      <p className="flex items-center gap-2 rounded-xl bg-verde-claro px-3 py-2 text-sm text-verde">
        <CheckCircle2 className="h-4 w-4" /> {sucesso}
      </p>
    );
  return null;
}

/**
 * Executa uma ação da API controlando carregamento, erro e mensagem de sucesso
 * (que some sozinha depois de alguns segundos).
 */
export function useAcao() {
  const [executando, setExecutando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  useEffect(() => {
    if (!sucesso) return;
    const id = window.setTimeout(() => setSucesso(null), 4000);
    return () => window.clearTimeout(id);
  }, [sucesso]);

  const executar = useCallback(async <T,>(nome: string, acao: () => Promise<T>, mensagemSucesso?: string): Promise<T | null> => {
    setErro(null);
    setSucesso(null);
    setExecutando(nome);
    try {
      const resultado = await acao();
      if (mensagemSucesso) setSucesso(mensagemSucesso);
      return resultado;
    } catch (e) {
      setErro(mensagemDeErro(e));
      return null;
    } finally {
      setExecutando(null);
    }
  }, []);

  return { executar, executando, erro, sucesso, setErro };
}
