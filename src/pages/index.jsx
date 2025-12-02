import Layout from "./Layout.jsx";
import Login from "./Login";
import OnboardingEmpresa from "./OnboardingEmpresa";
import OnboardingFuncionario from "./OnboardingFuncionario";
import EmpresaPublica from "./EmpresaPublica";
import BuscarServicos from "./BuscarServicos";
import LandingPage from "./LandingPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";

import Funcionarios from "./Funcionarios";
import Clientes from "./Clientes";
import NovoAgendamento from "./NovoAgendamento";
import Agendamentos from "./Agendamentos";
import Relatorios from "./Relatorios";
import Servicos from "./Servicos";
import Configuracoes from "./Configuracoes";
import Dashboard from "./Dashboard";
import MeuPerfil from "./MeuPerfil";
import TrocarSenha from "./TrocarSenha";

import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";

function PagesContent() {
    return (
        <Routes>
            {/* =====================================================
                ÁREA PÚBLICA (livegenda.com)
                Rotas acessíveis sem login
               ===================================================== */}
            
            {/* Landing page principal */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Busca pública de serviços próximos */}
            <Route path="/buscar" element={<BuscarServicos />} />
            
            {/* Página pública do estabelecimento */}
            <Route path="/empresa/:slug" element={<EmpresaPublica />} />
            
            {/* =====================================================
                ÁREA DE AUTENTICAÇÃO (app.livegenda.com)
                Login, cadastro e onboarding
               ===================================================== */}
            
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding-empresa" element={<OnboardingEmpresa />} />
            <Route path="/onboarding-funcionario" element={<OnboardingFuncionario />} />
            <Route path="/onboarding" element={<Navigate to="/onboarding-empresa" replace />} />
            
            {/* =====================================================
                ÁREA LOGADA (app.livegenda.com)
                Rotas protegidas - requerem autenticação
               ===================================================== */}
            
            <Route path="/funcionarios" element={
                <ProtectedRoute>
                    <Layout currentPageName="Funcionarios">
                        <Funcionarios />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/clientes" element={
                <ProtectedRoute>
                    <Layout currentPageName="Clientes">
                        <Clientes />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/novo-agendamento" element={
                <ProtectedRoute>
                    <Layout currentPageName="NovoAgendamento">
                        <NovoAgendamento />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/agendamentos" element={
                <ProtectedRoute>
                    <Layout currentPageName="Agendamentos">
                        <Agendamentos />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/relatorios" element={
                <ProtectedRoute>
                    <Layout currentPageName="Relatorios">
                        <Relatorios />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/servicos" element={
                <ProtectedRoute>
                    <Layout currentPageName="Servicos">
                        <Servicos />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/configuracoes" element={
                <ProtectedRoute>
                    <Layout currentPageName="Configuracoes">
                        <Configuracoes />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Layout currentPageName="Dashboard">
                        <Dashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/meu-perfil" element={
                <ProtectedRoute>
                    <Layout currentPageName="MeuPerfil">
                        <MeuPerfil />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/trocar-senha" element={
                <ProtectedRoute>
                    <Layout currentPageName="TrocarSenha">
                        <TrocarSenha />
                    </Layout>
                </ProtectedRoute>
            } />
            
            {/* =====================================================
                FALLBACK - Página não encontrada
               ===================================================== */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
            <Toaster />
        </Router>
    );
}
