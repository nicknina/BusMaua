import L from "leaflet";
import { useEffect, useRef, type ReactNode } from "react";
import type { Ponto } from "../lib/geo";
import type { Parada, TipoVeiculo } from "../lib/tipos";
import { classes } from "./ui";

export interface MarcadorVeiculo {
  id: number;
  ponto: Ponto;
  rotulo: string;
  tipo: TipoVeiculo;
  destaque?: boolean;
}

interface PropsMapa {
  /** Paradas da linha em destaque: desenhadas como trajeto. */
  rota?: Parada[] | null;
  veiculos?: MarcadorVeiculo[];
  voce?: { ponto: Ponto; estilo: "aluno" | "motorista" } | null;
  /** Mantém o mapa centralizado na posição "voce" (tela do motorista). */
  seguirVoce?: boolean;
  aoClicarVeiculo?: (id: number) => void;
  className?: string;
  children?: ReactNode;
}

const CENTRO_PADRAO: L.LatLngExpression = [-23.6345, -46.5665];

const svg = (conteudo: string, tamanho = 22) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${conteudo}</svg>`;

const ICONE_ONIBUS = svg(
  '<rect x="4" y="3" width="16" height="16" rx="3"/><path d="M4 11h16"/><path d="M8 15h.01"/><path d="M16 15h.01"/><path d="M6 19v2"/><path d="M18 19v2"/><path d="M9 7h6"/>',
);
const ICONE_PIN = svg(
  '<path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
);
const ICONE_NAVEGACAO = svg('<polygon points="3 11 22 2 13 21 11 13 3 11"/>', 20);

function escapar(texto: string) {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function iconeVeiculo(m: MarcadorVeiculo) {
  return L.divIcon({
    className: "",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    html: `<div class="marcador-veiculo ${m.destaque ? "destaque" : ""}">
             <span class="rotulo">${escapar(m.rotulo)}</span>
             <span class="circulo">${ICONE_ONIBUS}</span>
           </div>`,
  });
}

function iconeVoce(estilo: "aluno" | "motorista") {
  return L.divIcon({
    className: "",
    iconSize: estilo === "motorista" ? [72, 72] : [44, 44],
    iconAnchor: estilo === "motorista" ? [36, 36] : [22, 22],
    html:
      estilo === "motorista"
        ? `<div class="marcador-motorista"><span class="rotulo">Você</span><span class="halo"></span><span class="circulo">${ICONE_NAVEGACAO}</span></div>`
        : `<div class="marcador-aluno"><span class="rotulo">Você</span><span class="circulo">${ICONE_PIN}</span></div>`,
  });
}

export function Mapa({ rota, veiculos = [], voce, seguirVoce, aoClicarVeiculo, className, children }: PropsMapa) {
  const elemento = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const camadaRota = useRef<L.LayerGroup | null>(null);
  const camadaVeiculos = useRef<L.LayerGroup | null>(null);
  const camadaVoce = useRef<L.LayerGroup | null>(null);
  const rotaEnquadrada = useRef<string | null>(null);
  const cliqueRef = useRef(aoClicarVeiculo);
  cliqueRef.current = aoClicarVeiculo;

  // cria o mapa uma única vez
  useEffect(() => {
    if (!elemento.current) return;
    const m = L.map(elemento.current, { zoomControl: false, attributionControl: true }).setView(CENTRO_PADRAO, 14);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(m);
    m.attributionControl.setPrefix(false);
    camadaRota.current = L.layerGroup().addTo(m);
    camadaVeiculos.current = L.layerGroup().addTo(m);
    camadaVoce.current = L.layerGroup().addTo(m);
    mapa.current = m;

    // o contêiner pode mudar de tamanho depois da primeira renderização
    const observador = new ResizeObserver(() => m.invalidateSize());
    observador.observe(elemento.current);
    return () => {
      observador.disconnect();
      m.remove();
      mapa.current = null;
    };
  }, []);

  // trajeto da linha
  useEffect(() => {
    const m = mapa.current;
    const camada = camadaRota.current;
    if (!m || !camada) return;
    camada.clearLayers();
    if (!rota || rota.length === 0) return;

    const pontos = rota.map((p) => [p.latitude, p.longitude] as L.LatLngTuple);
    L.polyline(pontos, { color: "#0B4EA2", weight: 6, opacity: 0.9, lineJoin: "round" }).addTo(camada);
    rota.forEach((p) => {
      L.circleMarker([p.latitude, p.longitude], {
        radius: 7,
        color: "#0B4EA2",
        weight: 4,
        fillColor: "#ffffff",
        fillOpacity: 1,
      })
        .bindTooltip(p.nome, { direction: "top", offset: [0, -6] })
        .addTo(camada);
    });

    const chave = rota.map((p) => p.id).join("-");
    if (rotaEnquadrada.current !== chave && !seguirVoce) {
      m.fitBounds(L.latLngBounds(pontos), { padding: [36, 36] });
      rotaEnquadrada.current = chave;
    }
  }, [rota, seguirVoce]);

  // veículos
  useEffect(() => {
    const camada = camadaVeiculos.current;
    if (!camada) return;
    camada.clearLayers();
    veiculos.forEach((v) => {
      L.marker([v.ponto.lat, v.ponto.lng], { icon: iconeVeiculo(v), zIndexOffset: v.destaque ? 500 : 0 })
        .on("click", () => cliqueRef.current?.(v.id))
        .addTo(camada);
    });
  }, [veiculos]);

  // posição de quem está usando o app
  useEffect(() => {
    const camada = camadaVoce.current;
    if (!camada) return;
    camada.clearLayers();
    if (!voce) return;
    L.marker([voce.ponto.lat, voce.ponto.lng], { icon: iconeVoce(voce.estilo), zIndexOffset: 1000 }).addTo(camada);
    if (seguirVoce && mapa.current) {
      mapa.current.setView([voce.ponto.lat, voce.ponto.lng], Math.max(mapa.current.getZoom(), 15), { animate: true });
    }
  }, [voce, seguirVoce]);

  return (
    <div className={classes("relative overflow-hidden bg-mapa", className)}>
      <div ref={elemento} className="absolute inset-0" />
      {children && <div className="pointer-events-none absolute inset-0 z-[500]">{children}</div>}
    </div>
  );
}
