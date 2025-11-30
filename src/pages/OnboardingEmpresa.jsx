import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Building2, Phone, Mail, MapPin, Clock, Loader2, User, Lock, ArrowLeft } from "lucide-react";

const API_BASE = "";

const CATEGORIAS_EMPRESA = [
  { value: "salao_beleza", label: "Salão de Beleza" },
  { value: "barbearia", label: "Barbearia" },
  { value: "clinica_estetica", label: "Clínica de Estética" },
  { value: "spa", label: "SPA" },
  { value: "studio_unhas", label: "Studio de Unhas" },
  { value: "sobrancelhas", label: "Design de Sobrancelhas" },
  { value: "makeup", label: "Maquiagem" },
  { value: "massagem", label: "Massagem" },
  { value: "outro", label: "Outro" }
];

export default function OnboardingEmpresa() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Recuperar email do localStorage
  const onboardingData = JSON.parse(localStorage.getItem("livegenda_onboarding_data") || "{}");
  
  const [formData, setFormData] = useState({
    // Dados do usuário
    nome: "",
    email: onboardingData.email || "",
    senha: "",
    confirmarSenha: "",
    // Dados da empresa
    nomeNegocio: "",
    emailNegocio: onboardingData.email || "",
    categoria: "",
    telefone: "",
    endereco: "",
    horarioFuncionamento: {
      segunda: { inicio: "09:00", fim: "18:00", ativo: true },
      terca: { inicio: "09:00", fim: "18:00", ativo: true },
      quarta: { inicio: "09:00", fim: "18:00", ativo: true },
      quinta: { inicio: "09:00", fim: "18:00", ativo: true },
      sexta: { inicio: "09:00", fim: "18:00", ativo: true },
      sabado: { inicio: "09:00", fim: "14:00", ativo: true },
      domingo: { inicio: "09:00", fim: "14:00", ativo: false }
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleDayChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      horarioFuncionamento: {
        ...prev.horarioFuncionamento,
        [day]: { ...prev.horarioFuncionamento[day], [field]: value }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validações
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
      const response = await fetch(`${API_BASE}/api/auth/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Dados usuário
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          // Dados empresa
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

      // Salvar dados
      localStorage.setItem("livegenda_user", JSON.stringify(data.usuario));
      localStorage.setItem("livegenda_empresa", JSON.stringify(data.empresa));
      localStorage.removeItem("livegenda_onboarding_data");

      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao Livegenda!",
      });

      // Redirecionar usando window.location para garantir refresh
      window.location.href = "/agendamentos";

    } catch (err) {
      console.error("Erro no onboarding:", err);
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const diasSemana = [
    { key: "segunda", label: "Segunda" },
    { key: "terca", label: "Terça" },
    { key: "quarta", label: "Quarta" },
    { key: "quinta", label: "Quinta" },
    { key: "sexta", label: "Sexta" },
    { key: "sabado", label: "Sábado" },
    { key: "domingo", label: "Domingo" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/login")}
                data-testid="button-voltar"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-2xl">Criar sua conta</CardTitle>
                <CardDescription>
                  Configure seu perfil e seu negócio
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Seção: Seus dados */}
              <div className="space-y-3 pb-4 border-b">
                <h3 className="font-medium text-sm text-muted-foreground">Seus dados</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="nome">Seu nome *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nome"
                      placeholder="Como você se chama?"
                      value={formData.nome}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      data-testid="input-nome"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="senha"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={formData.senha}
                        onChange={(e) => handleInputChange("senha", e.target.value)}
                        className="pl-10"
                        disabled={loading}
                        autoComplete="new-password"
                        data-testid="input-senha"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha">Confirmar *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmarSenha"
                        type="password"
                        placeholder="Repetir senha"
                        value={formData.confirmarSenha}
                        onChange={(e) => handleInputChange("confirmarSenha", e.target.value)}
                        className="pl-10"
                        disabled={loading}
                        autoComplete="new-password"
                        data-testid="input-confirmar-senha"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção: Dados do negócio */}
              <div className="space-y-3 pb-4 border-b">
                <h3 className="font-medium text-sm text-muted-foreground">Dados do negócio</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="nomeNegocio">Nome do negócio *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nomeNegocio"
                      placeholder="Ex: Salão da Maria"
                      value={formData.nomeNegocio}
                      onChange={(e) => handleInputChange("nomeNegocio", e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      data-testid="input-nome-negocio"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailNegocio">Email do negócio</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="emailNegocio"
                      type="email"
                      placeholder="contato@meunegocio.com"
                      value={formData.emailNegocio}
                      onChange={(e) => handleInputChange("emailNegocio", e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      data-testid="input-email-negocio"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select 
                    value={formData.categoria} 
                    onValueChange={(value) => handleInputChange("categoria", value)}
                    disabled={loading}
                  >
                    <SelectTrigger data-testid="select-categoria">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_EMPRESA.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefone"
                      placeholder="(11) 99999-9999"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange("telefone", e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      data-testid="input-telefone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="endereco"
                      placeholder="Rua, número, bairro, cidade"
                      value={formData.endereco}
                      onChange={(e) => handleInputChange("endereco", e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      data-testid="input-endereco"
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Horário de funcionamento */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm text-muted-foreground">Horário de Funcionamento</h3>
                </div>
                <div className="space-y-2">
                  {diasSemana.map((dia) => (
                    <div key={dia.key} className="flex items-center gap-3 text-sm">
                      <Switch
                        checked={formData.horarioFuncionamento[dia.key].ativo}
                        onCheckedChange={(checked) => handleDayChange(dia.key, "ativo", checked)}
                        disabled={loading}
                      />
                      <span className="w-20">{dia.label}</span>
                      {formData.horarioFuncionamento[dia.key].ativo && (
                        <>
                          <Input
                            type="time"
                            value={formData.horarioFuncionamento[dia.key].inicio}
                            onChange={(e) => handleDayChange(dia.key, "inicio", e.target.value)}
                            className="w-24 h-8"
                            disabled={loading}
                          />
                          <span>às</span>
                          <Input
                            type="time"
                            value={formData.horarioFuncionamento[dia.key].fim}
                            onChange={(e) => handleDayChange(dia.key, "fim", e.target.value)}
                            className="w-24 h-8"
                            disabled={loading}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                data-testid="button-criar-conta"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar minha conta e negócio"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
