import Layout from "./Layout.jsx";
import Login from "./Login";
import Onboarding from "./Onboarding";
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

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';

const PAGES = {
    Funcionarios: Funcionarios,
    Clientes: Clientes,
    NovoAgendamento: NovoAgendamento,
    Agendamentos: Agendamentos,
    Relatorios: Relatorios,
    Servicos: Servicos,
    Configuracoes: Configuracoes,
    Dashboard: Dashboard,
    MeuPerfil: MeuPerfil,
    TrocarSenha: TrocarSenha,
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={
                <ProtectedRoute>
                    <Onboarding />
                </ProtectedRoute>
            } />
            
            {/* Rota raiz redireciona para agendamentos */}
            <Route path="/" element={
                <ProtectedRoute>
                    <Navigate to="/agendamentos" replace />
                </ProtectedRoute>
            } />
            
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
