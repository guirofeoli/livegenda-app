import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import OnboardingEmpresa from "@/pages/OnboardingEmpresa";
import OnboardingFuncionario from "@/pages/OnboardingFuncionario";
import Agendamentos from "@/pages/Agendamentos";
import Dashboard from "@/pages/Dashboard";
import Clientes from "@/pages/Clientes";
import Servicos from "@/pages/Servicos";
import Funcionarios from "@/pages/Funcionarios";
import Configuracoes from "@/pages/Configuracoes";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/onboarding-empresa" component={OnboardingEmpresa} />
      <Route path="/onboarding-funcionario" component={OnboardingFuncionario} />
      
      <Route path="/">
        <ProtectedRoute>
          <Redirect to="/agendamentos" />
        </ProtectedRoute>
      </Route>
      
      <Route path="/agendamentos">
        <ProtectedRoute>
          <Layout><Agendamentos /></Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/clientes">
        <ProtectedRoute>
          <Layout><Clientes /></Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/servicos">
        <ProtectedRoute>
          <Layout><Servicos /></Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/funcionarios">
        <ProtectedRoute>
          <Layout><Funcionarios /></Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/configuracoes">
        <ProtectedRoute>
          <Layout><Configuracoes /></Layout>
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
