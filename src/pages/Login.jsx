import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, ArrowRight, Building2 } from "lucide-react";

const API_BASE = "";

export default function Login() {
  const [step, setStep] = useState("email"); // email, password, new_user
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailInfo, setEmailInfo] = useState(null);

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Erro ao verificar email");
        setLoading(false);
        return;
      }

      setEmailInfo(data);

      if (data.type === "usuario") {
        // Usuário existe - pedir senha
        setStep("password");
      } else if (data.type === "funcionario") {
        // Funcionário sem conta - ir para onboarding de funcionário
        localStorage.setItem("livegenda_onboarding_data", JSON.stringify({
          type: "funcionario",
          email: email,
          funcionarioId: data.funcionarioId,
          empresaId: data.empresaId,
          empresaNome: data.empresaNome,
          nome: data.nome
        }));
        navigate("/onboarding-funcionario");
      } else {
        // Email novo - ir para onboarding de empresa
        localStorage.setItem("livegenda_onboarding_data", JSON.stringify({
          type: "empresa",
          email: email
        }));
        navigate("/onboarding-empresa");
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    }
    
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha: password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Senha incorreta");
        setLoading(false);
        return;
      }

      // Salvar dados da sessão
      localStorage.setItem("livegenda_user", JSON.stringify(data.usuario));
      if (data.empresa) {
        localStorage.setItem("livegenda_empresa", JSON.stringify(data.empresa));
      }
      
      // Redirecionar
      if (data.usuario.empresa_id) {
        window.location.href = "/agendamentos";
      } else {
        window.location.href = "/onboarding-empresa";
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    }
    
    setLoading(false);
  };

  const handleBack = () => {
    setStep("email");
    setPassword("");
    setError("");
    setEmailInfo(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Livegenda</h1>
          <p className="text-muted-foreground mt-2">Sistema de Agendamento Inteligente</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {step === "email" ? "Bem-vindo!" : "Digite sua senha"}
            </CardTitle>
            <CardDescription>
              {step === "email" 
                ? "Digite seu email para continuar" 
                : `Entrando como ${emailInfo?.nome || email}`
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {step === "email" && (
              <form onSubmit={handleCheckEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      required
                      autoComplete="email"
                      autoFocus
                      data-testid="input-email"
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading} data-testid="button-continuar">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
            
            {step === "password" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{email}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="ml-auto text-xs"
                      onClick={handleBack}
                    >
                      Trocar
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      required
                      autoComplete="current-password"
                      autoFocus
                      data-testid="input-password"
                    />
                  </div>
                </div>
                
                {emailInfo?.hasEmpresa && (
                  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg text-sm">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span>{emailInfo.empresaNome}</span>
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={loading} data-testid="button-entrar">
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
