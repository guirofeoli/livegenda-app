import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Usuário logado mas sem empresa -> vai para onboarding de empresa
  if (!user.empresa_id) {
    return <Navigate to="/onboarding-empresa" replace />;
  }

  return children;
}
