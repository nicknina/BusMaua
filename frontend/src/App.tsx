import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Carregando } from "./components/ui";
import { AuthProvider, rotaInicial, useAuth } from "./lib/auth";
import type { Perfil } from "./lib/tipos";
import { PainelAdmin } from "./telas/admin/PainelAdmin";
import { FilaVirtual } from "./telas/aluno/FilaVirtual";
import { Horarios } from "./telas/aluno/Horarios";
import { LayoutAluno } from "./telas/aluno/LayoutAluno";
import { MapaAoVivo } from "./telas/aluno/MapaAoVivo";
import { Notificacoes } from "./telas/aluno/Notificacoes";
import { Cadastro } from "./telas/Cadastro";
import { Login } from "./telas/Login";
import { Embarque } from "./telas/motorista/Embarque";
import { LayoutMotorista } from "./telas/motorista/LayoutMotorista";
import { Viagem } from "./telas/motorista/Viagem";
import { Perfil as TelaPerfil } from "./telas/Perfil";

function Protegida({ perfil, children }: { perfil: Perfil; children: ReactNode }) {
  const { usuario, carregando } = useAuth();
  if (carregando && !usuario) return <Carregando />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.perfil !== perfil) return <Navigate to={rotaInicial(usuario.perfil)} replace />;
  return <>{children}</>;
}

function Inicio() {
  const { usuario, carregando } = useAuth();
  if (carregando && !usuario) return <Carregando />;
  return <Navigate to={usuario ? rotaInicial(usuario.perfil) : "/login"} replace />;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          <Route
            path="/aluno"
            element={
              <Protegida perfil="ALUNO">
                <LayoutAluno />
              </Protegida>
            }
          >
            <Route index element={<Navigate to="mapa" replace />} />
            <Route path="mapa" element={<MapaAoVivo />} />
            <Route path="fila" element={<FilaVirtual />} />
            <Route path="horarios" element={<Horarios />} />
            <Route path="notificacoes" element={<Notificacoes />} />
            <Route path="perfil" element={<TelaPerfil />} />
          </Route>

          <Route
            path="/motorista"
            element={
              <Protegida perfil="MOTORISTA">
                <LayoutMotorista />
              </Protegida>
            }
          >
            <Route index element={<Navigate to="viagem" replace />} />
            <Route path="viagem" element={<Viagem />} />
            <Route path="passageiros" element={<Embarque />} />
            <Route path="perfil" element={<TelaPerfil />} />
          </Route>

          <Route
            path="/admin"
            element={
              <Protegida perfil="ADMIN">
                <PainelAdmin />
              </Protegida>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
