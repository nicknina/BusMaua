import { LogOut, Mail, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alerta, Botao, CabecalhoMotorista, CabecalhoTela, Cartao } from "../components/ui";
import { useAuth } from "../lib/auth";
import { iniciais } from "../lib/formato";

const NOME_PERFIL = { ALUNO: "Aluno", MOTORISTA: "Motorista", ADMIN: "Administração" } as const;

export function Perfil() {
  const { usuario, sair } = useAuth();
  const navegar = useNavigate();
  if (!usuario) return null;

  const motorista = usuario.perfil === "MOTORISTA";

  return (
    <>
      {motorista ? <CabecalhoMotorista titulo="Perfil" /> : <CabecalhoTela titulo="Perfil" voltar={false} />}
      <div className={motorista ? "flex flex-col gap-4 px-4 pt-4" : "flex flex-col gap-4 px-4"}>
        <Cartao className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-azul-claro text-xl font-bold text-azul">
            {iniciais(usuario.nome)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold">{usuario.nome}</h2>
            <p className="flex items-center gap-1.5 truncate text-sm text-cinza">
              <Mail className="h-4 w-4 shrink-0" /> {usuario.email}
            </p>
            <span className="mt-1 inline-block rounded-full bg-azul-claro px-3 py-0.5 text-xs font-semibold text-azul">
              {NOME_PERFIL[usuario.perfil]}
            </span>
          </div>
        </Cartao>

        <Alerta tipo="info" icone={<ShieldCheck className="h-5 w-5 text-azul" />}>
          {motorista
            ? "Sua localização só é compartilhada durante a viagem que você iniciar, e apenas a posição do veículo é exibida aos alunos."
            : "Usamos seu nome, e-mail e registros de embarque apenas para organizar o transporte (LGPD). O motorista vê só seu primeiro nome e a inicial do sobrenome."}
        </Alerta>

        <Botao
          variante="contornoPerigo"
          icone={<LogOut className="h-5 w-5" />}
          onClick={() => {
            sair();
            navegar("/login", { replace: true });
          }}
        >
          Sair da conta
        </Botao>
      </div>
    </>
  );
}
