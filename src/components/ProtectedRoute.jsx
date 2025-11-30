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
      
      console.log("ProtectedRoute - Raw savedUser:", savedUser);
      console.log("ProtectedRoute - Raw savedEmpresa:", savedEmpresa);
      
      let user = null;
      let empresa = null;
      
      if (savedUser) {
        user = JSON.parse(savedUser);
        console.log("ProtectedRoute - Parsed user:", user);
        console.log("ProtectedRoute - user.empresa_id:", user?.empresa_id);
      }
      if (savedEmpresa) {
        empresa = JSON.parse(savedEmpresa);
        console.log("ProtectedRoute - Parsed empresa:", empresa);
        console.log("ProtectedRoute - empresa.id:", empresa?.id);
      }
      
      const hasEmpresa = user?.empresa_id || empresa?.id;
      console.log("ProtectedRoute - hasEmpresa:", hasEmpresa);
      
      setAuthState({ user, empresa, loading: false });
    } catch (e) {
      console.error("ProtectedRoute - Erro ao verificar auth:", e);
      setAuthState({ user: null, empresa: null, loading: false });
    }
  };

  console.log("ProtectedRoute - Current authState:", authState);

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Não logado -> vai para login
  if (!authState.user) {
    console.log("ProtectedRoute - Redirecionando para /login (sem user)");
    return <Navigate to="/login" replace />;
  }

  // Verificar empresa_id do user OU empresa salva separadamente
  const hasEmpresa = authState.user?.empresa_id || authState.empresa?.id;
  
  // Usuário logado mas sem empresa -> vai para onboarding de empresa
  if (!hasEmpresa) {
    console.log("ProtectedRoute - Redirecionando para /onboarding-empresa (sem empresa)");
    return <Navigate to="/onboarding-empresa" replace />;
  }

  console.log("ProtectedRoute - Renderizando children");
  return children;
}
