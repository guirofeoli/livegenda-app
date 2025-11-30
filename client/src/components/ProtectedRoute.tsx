import { useLocation, Redirect } from "wouter";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  nome: string;
  email: string;
  empresa_id: string | null;
  role: string;
  onboarding_concluido: boolean;
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [location] = useLocation();

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("livegenda_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch {
      console.error("Erro ao verificar auth");
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  // Se onboarding não foi concluído, redirecionar para a página apropriada
  if (!user.onboarding_concluido) {
    // Permitir acesso às páginas de onboarding
    if (location === "/onboarding-empresa" || location === "/onboarding-funcionario") {
      return <>{children}</>;
    }
    
    // Se não tem empresa_id, é um novo usuário admin - vai para onboarding-empresa
    if (!user.empresa_id) {
      return <Redirect to="/onboarding-empresa" />;
    }
    
    // Se tem empresa_id mas onboarding não concluído, é funcionário - vai para onboarding-funcionario
    if (user.role === "funcionario") {
      return <Redirect to="/onboarding-funcionario" />;
    }
  }

  return <>{children}</>;
}
