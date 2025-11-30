import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }) {
  const [authState, setAuthState] = useState({ user: null, empresa: null, loading: true });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const savedUser = localStorage.getItem("livegenda_user");
      const savedEmpresa = localStorage.getItem("livegenda_empresa");
      
      let user = null;
      let empresa = null;
      
      if (savedUser) {
        user = JSON.parse(savedUser);
      }
      if (savedEmpresa) {
        empresa = JSON.parse(savedEmpresa);
      }
      
      setAuthState({ user, empresa, loading: false });
    } catch (e) {
      console.error("Erro ao verificar auth:", e);
      setAuthState({ user: null, empresa: null, loading: false });
    }
  };

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Não logado -> vai para login
  if (!authState.user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar empresa_id do user OU empresa salva separadamente
  const hasEmpresa = authState.user.empresa_id || authState.empresa?.id;
  
  // Usuário logado mas sem empresa -> vai para onboarding de empresa
  if (!hasEmpresa) {
    return <Navigate to="/onboarding-empresa" replace />;
  }

  return children;
}
