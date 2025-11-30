import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, Lock, User } from "lucide-react";

const API_BASE = "";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Cadastro form
  const [cadastroNome, setCadastroNome] = useState("");
  const [cadastroEmail, setCadastroEmail] = useState("");
  const [cadastroPassword, setCadastroPassword] = useState("");
  const [cadastroConfirmPassword, setCadastroConfirmPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, senha: loginPassword })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Erro ao fazer login");
        setLoading(false);
        return;
      }

      // Salvar dados da sessão
      localStorage.setItem("livegenda_user", JSON.stringify(data.usuario));
      if (data.empresa) {
        localStorage.setItem("livegenda_empresa", JSON.stringify(data.empresa));
      }
      
      // Redirecionar baseado em ter empresa ou não
      if (data.usuario.empresa_id) {
        navigate("/agendamentos");
      } else {
        navigate("/onboarding");
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    }
    
    setLoading(false);
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (cadastroPassword.length < 6) {
      setError("Senha deve ter no mínimo 6 caracteres");
      setLoading(false);
      return;
    }

    if (cadastroPassword !== cadastroConfirmPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: cadastroEmail, 
          senha: cadastroPassword,
          nome: cadastroNome || cadastroEmail.split("@")[0]
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Erro ao criar conta");
        setLoading(false);
        return;
      }

      // Salvar dados da sessão
      localStorage.setItem("livegenda_user", JSON.stringify(data.usuario));
      
      // Ir para onboarding para configurar empresa
      navigate("/onboarding");
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Livegenda</h1>
          <p className="text-muted-foreground mt-2">Sistema de Agendamento</p>
        </div>
        
        <Card>
          <Tabs defaultValue="login" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-testid="tab-login">Entrar</TabsTrigger>
                <TabsTrigger value="cadastro" data-testid="tab-cadastro">Criar conta</TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                        required
                        autoComplete="email"
                        data-testid="input-login-email"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Sua senha"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                        required
                        autoComplete="current-password"
                        data-testid="input-login-password"
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading} data-testid="button-login">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="cadastro">
                <form onSubmit={handleCadastro} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cadastro-nome">Seu nome</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="cadastro-nome"
                        type="text"
                        placeholder="Como você se chama?"
                        value={cadastroNome}
                        onChange={(e) => setCadastroNome(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                        autoComplete="name"
                        data-testid="input-cadastro-nome"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cadastro-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="cadastro-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={cadastroEmail}
                        onChange={(e) => setCadastroEmail(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                        required
                        autoComplete="email"
                        data-testid="input-cadastro-email"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cadastro-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="cadastro-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={cadastroPassword}
                        onChange={(e) => setCadastroPassword(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                        required
                        autoComplete="new-password"
                        data-testid="input-cadastro-password"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cadastro-confirm-password">Confirmar senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="cadastro-confirm-password"
                        type="password"
                        placeholder="Digite a senha novamente"
                        value={cadastroConfirmPassword}
                        onChange={(e) => setCadastroConfirmPassword(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                        required
                        autoComplete="new-password"
                        data-testid="input-cadastro-confirm-password"
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading} data-testid="button-cadastro">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      "Criar conta"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
