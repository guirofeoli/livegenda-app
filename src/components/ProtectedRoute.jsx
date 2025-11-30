import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children, requireEmpresa = false }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const savedUser = localStorage.getItem("livegenda_user");
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      }
    } catch (e) {
      console.error("Erro ao verificar auth:", e);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Não logado -> vai para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logado mas sem empresa e não está no onboarding -> vai para onboarding
  if (!user.empresa_id && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // Logado com empresa mas está no onboarding -> vai para agendamentos
  if (user.empresa_id && location.pathname === "/onboarding") {
    return <Navigate to="/agendamentos" replace />;
  }

  return children;
}
