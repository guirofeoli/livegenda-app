import { useLocation, Redirect } from "wouter";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  nome: string;
  email: string;
  empresaId: string | null;
  role: string;
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

  if (!user.empresaId && location !== "/onboarding-empresa") {
    return <Redirect to="/onboarding-empresa" />;
  }

  return <>{children}</>;
}
