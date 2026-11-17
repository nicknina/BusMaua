import { AlertTriangle, Bus, Check, Clock, Flag, Radio, Users } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CabecalhoTela, Carregando, classes, Vazio } from "../../components/ui";
import { quando } from "../../lib/formato";
import { useNotificacoes } from "../../lib/hooks";
import type { Notificacao, TipoNotificacao } from "../../lib/tipos";

type Filtro = "todas" | "onibus" | "fila";

const CATEGORIA: Record<TipoNotificacao, Exclude<Filtro, "todas">> = {
  VIAGEM_INICIADA: "onibus",
  CHEGANDO: "onibus",
  ATRASO: "onibus",
  VIAGEM_ENCERRADA: "onibus",
  SUA_VEZ: "fila",
  EMBARQUE_CONFIRMADO: "fila",
  FILA_EXPIRADA: "fila",
};

const ICONE: Record<TipoNotificacao, { icone: ReactNode; fundo: string }> = {
  VIAGEM_INICIADA: { icone: <Radio className="h-6 w-6 text-verde" />, fundo: "bg-verde-claro" },
  CHEGANDO: { icone: <Bus className="h-6 w-6 text-azul" />, fundo: "bg-azul-claro" },
  ATRASO: { icone: <AlertTriangle className="h-6 w-6 text-ambar-escuro" />, fundo: "bg-ambar-claro" },
  VIAGEM_ENCERRADA: { icone: <Flag className="h-6 w-6 text-cinza" />, fundo: "bg-cinza-linha" },
  SUA_VEZ: { icone: <Users className="h-6 w-6 text-azul" />, fundo: "bg-azul-claro" },
  EMBARQUE_CONFIRMADO: { icone: <Check className="h-6 w-6 text-verde" />, fundo: "bg-verde-claro" },
  FILA_EXPIRADA: { icone: <Clock className="h-6 w-6 text-vermelho" />, fundo: "bg-vermelho-claro" },
};

export function Notificacoes() {
  const { lista, vistoAte, marcarComoVistas } = useNotificacoes();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  // guarda o "visto até" de quando a tela abriu, para manter o destaque das novas
  const vistoAoAbrir = useRef(vistoAte);

  useEffect(() => {
    if (lista) marcarComoVistas();
  }, [lista, marcarComoVistas]);

  const filtradas = (lista ?? []).filter((n) => filtro === "todas" || CATEGORIA[n.tipo] === filtro);

  return (
    <>
      <CabecalhoTela titulo="Notificações" subtitulo="Avisos do seu transporte" />
      <div className="flex flex-col gap-3 px-4">
        <div className="flex gap-2">
          {(
            [
              ["todas", "Todas"],
              ["onibus", "Ônibus"],
              ["fila", "Fila"],
            ] as const
          ).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setFiltro(valor)}
              className={classes(
                "rounded-full px-4 py-1 text-sm font-semibold",
                filtro === valor ? "bg-azul text-white" : "bg-white text-tinta shadow-cartao",
              )}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {lista === null && <Carregando />}
        {lista !== null && filtradas.length === 0 && (
          <Vazio titulo="Nada por aqui ainda">Os avisos de viagens e da fila aparecem nesta tela.</Vazio>
        )}

        {filtradas.map((n) => (
          <ItemNotificacao key={n.id} notificacao={n} nova={new Date(n.criadaEm).getTime() > vistoAoAbrir.current} />
        ))}
      </div>
    </>
  );
}

function ItemNotificacao({ notificacao: n, nova }: { notificacao: Notificacao; nova: boolean }) {
  const { icone, fundo } = ICONE[n.tipo];
  return (
    <article
      className={classes(
        "flex gap-3 rounded-3xl bg-white p-4 shadow-cartao",
        nova && "ring-1 ring-azul-medio",
      )}
    >
      <span className={classes("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", fundo)}>{icone}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-bold leading-tight">{n.titulo}</h2>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-cinza">
            {quando(n.criadaEm)}
            {nova && <span className="h-2 w-2 rounded-full bg-vermelho" />}
          </span>
        </div>
        <p className="mt-0.5 text-sm leading-snug text-cinza">{n.mensagem}</p>
      </div>
    </article>
  );
}
