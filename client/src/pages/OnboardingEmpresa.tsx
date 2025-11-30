import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Phone, Mail, MapPin, Clock, Loader2, User, Lock, ArrowLeft } from "lucide-react";

const CATEGORIAS = [
  { value: "salao_beleza", label: "Salão de Beleza" },
  { value: "barbearia", label: "Barbearia" },
  { value: "clinica_estetica", label: "Clínica de Estética" }
];

export default function OnboardingEmpresa() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    nomeNegocio: "",
    emailNegocio: "",
    categoria: "",
    telefone: "",
    endereco: ""
  });

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("livegenda_onboarding_data") || "{}");
    if (data.email) {
      setFormData(prev => ({ ...prev, email: data.email, emailNegocio: data.email }));
    }
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.nome || !formData.email || !formData.senha) {
      setError("Preencha todos os campos obrigatórios");
      setLoading(false);
      return;
    }

    if (formData.senha.length < 6) {
      setError("Senha deve ter no mínimo 6 caracteres");
      setLoading(false);
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    if (!formData.nomeNegocio || !formData.categoria || !formData.telefone) {
      setError("Preencha todos os campos do negócio");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          nomeNegocio: formData.nomeNegocio,
          emailNegocio: formData.emailNegocio || formData.email,
          categoria: formData.categoria,
          telefone: formData.telefone,
          endereco: formData.endereco || null
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Erro ao criar conta");
        setLoading(false);
        return;
      }

      localStorage.setItem("livegenda_user", JSON.stringify(data.usuario));
      localStorage.setItem("livegenda_empresa", JSON.stringify(data.empresa));
      localStorage.removeItem("livegenda_onboarding_data");

      toast({ title: "Conta criada!", description: "Bem-vindo ao Livegenda!" });
      window.location.href = "/agendamentos";
    } catch {
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/login")} data-testid="button-voltar">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-2xl">Criar sua conta</CardTitle>
                <CardDescription>Configure seu perfil e negócio</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3 pb-4 border-b">
                <h3 className="font-medium text-sm text-muted-foreground">Seus dados</h3>
                <div className="space-y-2">
                  <Label>Seu nome *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Como você se chama?" value={formData.nome} onChange={(e) => handleChange("nome", e.target.value)} className="pl-10" disabled={loading} data-testid="input-nome" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="email" placeholder="seu@email.com" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} className="pl-10" disabled={loading} data-testid="input-email" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Senha *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="Min 6 caracteres" value={formData.senha} onChange={(e) => handleChange("senha", e.target.value)} className="pl-10" disabled={loading} data-testid="input-senha" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="Repetir" value={formData.confirmarSenha} onChange={(e) => handleChange("confirmarSenha", e.target.value)} className="pl-10" disabled={loading} data-testid="input-confirmar" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pb-4">
                <h3 className="font-medium text-sm text-muted-foreground">Dados do negócio</h3>
                <div className="space-y-2">
                  <Label>Nome do negócio *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Ex: Salão da Maria" value={formData.nomeNegocio} onChange={(e) => handleChange("nomeNegocio", e.target.value)} className="pl-10" disabled={loading} data-testid="input-negocio" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select value={formData.categoria} onValueChange={(v) => handleChange("categoria", v)} disabled={loading}>
                    <SelectTrigger data-testid="select-categoria"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Telefone/WhatsApp *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="(11) 99999-9999" value={formData.telefone} onChange={(e) => handleChange("telefone", e.target.value)} className="pl-10" disabled={loading} data-testid="input-telefone" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rua, número, bairro" value={formData.endereco} onChange={(e) => handleChange("endereco", e.target.value)} className="pl-10" disabled={loading} data-testid="input-endereco" />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading} data-testid="button-criar">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</> : "Criar minha conta e negócio"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
