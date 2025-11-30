import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Building2, Loader2, User, Lock, ArrowLeft, Mail } from "lucide-react";

interface OnboardingData {
  type: string;
  email: string;
  funcionarioId: string;
  empresaId: string;
  empresaNome: string;
  nome: string;
}

export default function OnboardingFuncionario() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<OnboardingData | null>(null);
  const [formData, setFormData] = useState({ nome: "", senha: "", confirmarSenha: "" });

  useEffect(() => {
    const d = JSON.parse(localStorage.getItem("livegenda_onboarding_data") || "{}");
    if (d.type !== "funcionario") { setLocation("/login"); return; }
    setData(d);
    setFormData(prev => ({ ...prev, nome: d.nome || "" }));
  }, [setLocation]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setLoading(true);
    setError("");

    if (!formData.nome || !formData.senha) { setError("Preencha todos os campos"); setLoading(false); return; }
    if (formData.senha.length < 6) { setError("Senha deve ter no mínimo 6 caracteres"); setLoading(false); return; }
    if (formData.senha !== formData.confirmarSenha) { setError("As senhas não coincidem"); setLoading(false); return; }

    try {
      const response = await fetch("/api/auth/onboarding-funcionario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funcionarioId: data.funcionarioId,
          empresaId: data.empresaId,
          email: data.email,
          nome: formData.nome,
          senha: formData.senha
        })
      });
      
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Erro ao criar conta"); setLoading(false); return; }

      localStorage.setItem("livegenda_user", JSON.stringify(result.usuario));
      localStorage.setItem("livegenda_empresa", JSON.stringify(result.empresa));
      localStorage.removeItem("livegenda_onboarding_data");

      toast({ title: "Conta criada!", description: `Bem-vindo à ${result.empresa.nome}!` });
      window.location.href = "/agendamentos";
    } catch {
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!data) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/login")} data-testid="button-voltar">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-2xl">Criar sua conta</CardTitle>
                <CardDescription>Complete seu cadastro</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg mb-6">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{data.empresaNome}</p>
                <p className="text-sm text-muted-foreground">Você foi convidado como funcionário</p>
              </div>
            </div>

            {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{data.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Seu nome *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Como você se chama?" value={formData.nome} onChange={(e) => handleChange("nome", e.target.value)} className="pl-10" disabled={loading} data-testid="input-nome" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Criar senha *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type="password" placeholder="Mínimo 6 caracteres" value={formData.senha} onChange={(e) => handleChange("senha", e.target.value)} className="pl-10" disabled={loading} data-testid="input-senha" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Confirmar senha *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type="password" placeholder="Repetir senha" value={formData.confirmarSenha} onChange={(e) => handleChange("confirmarSenha", e.target.value)} className="pl-10" disabled={loading} data-testid="input-confirmar" />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading} data-testid="button-criar">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</> : "Criar minha conta"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
