import { ArrowDown, ArrowUp, MapPin, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Mapa } from "../../components/Mapa";
import { Carregando, classes } from "../../components/ui";
import { api } from "../../lib/api";
import type { Ponto } from "../../lib/geo";
import type { LinhaAdmin, Parada } from "../../lib/tipos";
import { BotaoAdmin, Campo, Mensagem, Secao, useAcao } from "./componentesAdmin";

interface FormParada {
  nome: string;
  descricao: string;
  latitude: string;
  longitude: string;
  minutosDesdeSaida: string;
}

const PARADA_VAZIA: FormParada = { nome: "", descricao: "", latitude: "", longitude: "", minutosDesdeSaida: "" };

function paraForm(p: Parada): FormParada {
  return {
    nome: p.nome,
    descricao: p.descricao ?? "",
    latitude: String(p.latitude),
    longitude: String(p.longitude),
    minutosDesdeSaida: String(p.minutosDesdeSaida),
  };
}

function paraCorpo(f: FormParada) {
  return {
    nome: f.nome.trim(),
    descricao: f.descricao.trim() || null,
    latitude: Number(f.latitude.replace(",", ".")),
    longitude: Number(f.longitude.replace(",", ".")),
    minutosDesdeSaida: Number(f.minutosDesdeSaida || 0),
  };
}

const NOVA_LINHA = -1;

export function GestaoLinhas() {
  const [linhas, setLinhas] = useState<LinhaAdmin[] | null>(null);
  const [linhaId, setLinhaId] = useState<number | null>(null);
  const [dadosLinha, setDadosLinha] = useState({ nome: "", origem: "", destino: "" });
  const [formParada, setFormParada] = useState<FormParada>(PARADA_VAZIA);
  const [editandoParada, setEditandoParada] = useState<number | null>(null);
  const { executar, executando, erro, sucesso } = useAcao();

  useEffect(() => {
    executar("carregar", () => api.get<LinhaAdmin[]>("/admin/linhas").then(setLinhas));
  }, [executar]);

  const criandoLinha = linhaId === NOVA_LINHA;
  const linha = criandoLinha ? null : linhas?.find((l) => l.id === linhaId) ?? linhas?.[0] ?? null;

  // ao trocar de linha, carrega os dados dela no formulário
  useEffect(() => {
    setDadosLinha(linha ? { nome: linha.nome, origem: linha.origem, destino: linha.destino } : { nome: "", origem: "", destino: "" });
    setFormParada(PARADA_VAZIA);
    setEditandoParada(null);
  }, [linha?.id]);

  function substituirLinha(atualizada: LinhaAdmin) {
    setLinhas((lista) => {
      if (!lista) return lista;
      return lista.some((l) => l.id === atualizada.id) ? lista.map((l) => (l.id === atualizada.id ? atualizada : l)) : [...lista, atualizada];
    });
  }

  async function salvarLinha() {
    const atualizada = criandoLinha
      ? await executar("linha", () => api.post<LinhaAdmin>("/admin/linhas", dadosLinha), "Linha criada. Agora cadastre as paradas.")
      : linha && (await executar("linha", () => api.put<LinhaAdmin>(`/admin/linhas/${linha.id}`, dadosLinha), "Linha atualizada."));
    if (atualizada) {
      substituirLinha(atualizada);
      setLinhaId(atualizada.id);
    }
  }

  async function salvarParada() {
    if (!linha) return;
    const corpo = paraCorpo(formParada);
    const atualizada =
      editandoParada !== null
        ? await executar("parada", () => api.put<LinhaAdmin>(`/admin/paradas/${editandoParada}`, corpo), "Parada atualizada.")
        : await executar("parada", () => api.post<LinhaAdmin>(`/admin/linhas/${linha.id}/paradas`, corpo), "Parada adicionada ao fim da linha.");
    if (atualizada) {
      substituirLinha(atualizada);
      setFormParada(PARADA_VAZIA);
      setEditandoParada(null);
    }
  }

  async function mover(p: Parada, direcao: "cima" | "baixo") {
    const atualizada = await executar(`mover${p.id}`, () => api.post<LinhaAdmin>(`/admin/paradas/${p.id}/mover?direcao=${direcao}`));
    if (atualizada) substituirLinha(atualizada);
  }

  async function excluir(p: Parada) {
    if (!window.confirm(`Excluir a parada "${p.nome}"?`)) return;
    const atualizada = await executar(`excluir${p.id}`, () => api.delete<LinhaAdmin>(`/admin/paradas/${p.id}`), "Parada excluída.");
    if (atualizada) substituirLinha(atualizada);
  }

  function escolherNoMapa(ponto: Ponto) {
    setFormParada((f) => ({ ...f, latitude: ponto.lat.toFixed(6), longitude: ponto.lng.toFixed(6) }));
  }

  if (!linhas) return erro ? <Mensagem erro={erro} sucesso={null} /> : <Carregando />;

  const formParadaValido =
    formParada.nome.trim() && formParada.latitude && formParada.longitude && !Number.isNaN(Number(formParada.latitude.replace(",", ".")));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {linhas.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setLinhaId(l.id)}
            className={classes(
              "rounded-full px-4 py-2 text-sm font-semibold",
              l.id === linha?.id ? "bg-azul text-white" : "bg-white text-tinta shadow-cartao",
            )}
          >
            {l.nome}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setLinhaId(NOVA_LINHA)}
          className={classes(
            "flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold",
            criandoLinha ? "bg-azul text-white" : "bg-azul-claro text-azul",
          )}
        >
          <Plus className="h-4 w-4" /> Nova linha
        </button>
      </div>

      <Secao titulo={criandoLinha ? "Nova linha" : "Dados da linha"}>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
          <Campo rotulo="Nome" placeholder="Ex.: Mauá → Estação Tamanduateí" value={dadosLinha.nome} onChange={(e) => setDadosLinha({ ...dadosLinha, nome: e.target.value })} />
          <Campo rotulo="Origem" value={dadosLinha.origem} onChange={(e) => setDadosLinha({ ...dadosLinha, origem: e.target.value })} />
          <Campo rotulo="Destino" value={dadosLinha.destino} onChange={(e) => setDadosLinha({ ...dadosLinha, destino: e.target.value })} />
          <BotaoAdmin
            carregando={executando === "linha"}
            disabled={!dadosLinha.nome.trim() || !dadosLinha.origem.trim() || !dadosLinha.destino.trim()}
            onClick={salvarLinha}
          >
            {criandoLinha ? "Criar linha" : "Salvar"}
          </BotaoAdmin>
        </div>
      </Secao>

      <Mensagem erro={erro} sucesso={sucesso} />

      {linha && (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <Secao titulo="Paradas" descricao="Na ordem do trajeto. O tempo é contado a partir da saída e alimenta a grade de horários.">
            {linha.paradas.length === 0 ? (
              <p className="text-sm text-cinza">Nenhuma parada cadastrada. Use o formulário ao lado.</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {linha.paradas.map((p, i) => (
                  <li
                    key={p.id}
                    className={classes(
                      "flex items-center gap-3 rounded-2xl bg-fundo px-3 py-2",
                      editandoParada === p.id && "ring-2 ring-azul",
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-azul text-sm font-bold text-white">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">
                        {p.nome} {p.descricao && <span className="text-xs font-normal text-cinza">· {p.descricao}</span>}
                      </div>
                      <div className="text-xs text-cinza">
                        +{p.minutosDesdeSaida} min · {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <BotaoAdmin variante="texto" className="px-2" aria-label="Subir" disabled={i === 0 || executando !== null} onClick={() => mover(p, "cima")}>
                        <ArrowUp className="h-4 w-4" />
                      </BotaoAdmin>
                      <BotaoAdmin
                        variante="texto"
                        className="px-2"
                        aria-label="Descer"
                        disabled={i === linha.paradas.length - 1 || executando !== null}
                        onClick={() => mover(p, "baixo")}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </BotaoAdmin>
                      <BotaoAdmin
                        variante="texto"
                        onClick={() => {
                          setEditandoParada(p.id);
                          setFormParada(paraForm(p));
                        }}
                      >
                        Editar
                      </BotaoAdmin>
                      <BotaoAdmin variante="texto" className="px-2 text-vermelho" aria-label="Excluir" carregando={executando === `excluir${p.id}`} onClick={() => excluir(p)}>
                        <Trash2 className="h-4 w-4" />
                      </BotaoAdmin>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Secao>

          <Secao
            titulo={editandoParada !== null ? "Editar parada" : "Nova parada"}
            descricao="Clique no mapa para preencher a latitude e a longitude."
          >
            <Mapa className="mb-3 h-56 cursor-crosshair rounded-2xl" rota={linha.paradas} aoClicarMapa={escolherNoMapa} />
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Campo rotulo="Nome" placeholder="Ex.: Av. Goiás · Ponto 3" value={formParada.nome} onChange={(e) => setFormParada({ ...formParada, nome: e.target.value })} />
              </div>
              <Campo rotulo="Descrição (opcional)" placeholder="Saída, Chegada…" value={formParada.descricao} onChange={(e) => setFormParada({ ...formParada, descricao: e.target.value })} />
              <Campo
                rotulo="Minutos desde a saída"
                type="number"
                min={0}
                value={formParada.minutosDesdeSaida}
                onChange={(e) => setFormParada({ ...formParada, minutosDesdeSaida: e.target.value })}
              />
              <Campo rotulo="Latitude" value={formParada.latitude} onChange={(e) => setFormParada({ ...formParada, latitude: e.target.value })} />
              <Campo rotulo="Longitude" value={formParada.longitude} onChange={(e) => setFormParada({ ...formParada, longitude: e.target.value })} />
            </div>
            <div className="mt-3 flex gap-2">
              <BotaoAdmin carregando={executando === "parada"} disabled={!formParadaValido} onClick={salvarParada}>
                {editandoParada !== null ? "Salvar parada" : (<><MapPin className="h-4 w-4" /> Adicionar parada</>)}
              </BotaoAdmin>
              {editandoParada !== null && (
                <BotaoAdmin
                  variante="texto"
                  onClick={() => {
                    setEditandoParada(null);
                    setFormParada(PARADA_VAZIA);
                  }}
                >
                  Cancelar
                </BotaoAdmin>
              )}
            </div>
          </Secao>
        </div>
      )}
    </div>
  );
}
