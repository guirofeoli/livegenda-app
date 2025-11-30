import { useState, useEffect } from "react";
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
import { Building2, Phone, Mail, MapPin, Clock, Loader2, User } from "lucide-react";

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

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    nomeNegocio: "",
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
    },
    intervaloAgendamento: 30,
    lembreteAutomatico: true,
    tempoAntecedenciaLembrete: 24
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("livegenda_user");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      if (userData.empresa_id) {
        navigate("/dashboard");
        return;
      }
      setUser(userData);
      setFormData(prev => ({ 
        ...prev, 
        email: userData.email || "",
        nome: userData.nome || ""
      }));
      setStep(2);
    }
  }, [navigate]);

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

  const validateStep1 = () => {
    if (!formData.nome || !formData.email || !formData.senha) {
      setError("Preencha todos os campos obrigatórios");
      return false;
    }
    if (formData.senha.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return false;
    }
    if (formData.senha !== formData.confirmarSenha) {
      setError("As senhas não coincidem");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.nomeNegocio || !formData.telefone || !formData.categoria) {
      setError("Preencha todos os campos obrigatórios");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (step === 1) {
        if (!validateStep1()) {
          setLoading(false);
          return;
        }
        setStep(2);
        setLoading(false);
        return;
      }

      if (!validateStep2()) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          senha: formData.senha,
          nome: formData.nome,
          nomeNegocio: formData.nomeNegocio,
          categoria: formData.categoria,
          telefone: formData.telefone,
          endereco: formData.endereco || null
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Erro ao criar conta");
        toast({
          title: "Erro",
          description: data.error || "Erro ao criar conta",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      localStorage.setItem("livegenda_user", JSON.stringify(data.usuario));
      localStorage.setItem("livegenda_empresa", JSON.stringify(data.empresa));

      toast({
        title: "Sucesso!",
        description: "Sua conta foi criada com sucesso!",
      });

      navigate("/dashboard");

    } catch (err) {
      console.error("Erro no onboarding:", err);
      setError("Erro ao criar conta. Tente novamente.");
      toast({
        title: "Erro",
        description: "Erro ao criar conta. Tente novamente.",
        variant: "destructive"
      });
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
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {step === 1 ? "Crie sua conta" : "Configure seu negócio"}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? "Preencha seus dados para começar" 
                : "Configure as informações do seu estabelecimento"}
            </CardDescription>
            <div className="flex justify-center gap-2 mt-4">
              <div className={`h-2 w-16 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
              <div className={`h-2 w-16 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Seu nome *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="nome"
                        placeholder="Seu nome completo"
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

                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha *</Label>
                    <Input
                      id="senha"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.senha}
                      onChange={(e) => handleInputChange("senha", e.target.value)}
                      disabled={loading}
                      data-testid="input-senha"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmarSenha">Confirmar senha *</Label>
                    <Input
                      id="confirmarSenha"
                      type="password"
                      placeholder="Digite a senha novamente"
                      value={formData.confirmarSenha}
                      onChange={(e) => handleInputChange("confirmarSenha", e.target.value)}
                      disabled={loading}
                      data-testid="input-confirmar-senha"
                    />
                  </div>
                </>
              ) : (
                <>
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

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Label>Horário de Funcionamento</Label>
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
                </>
              )}

              <div className="flex gap-3 pt-4">
                {step === 2 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="flex-1"
                    data-testid="button-voltar"
                  >
                    Voltar
                  </Button>
                )}
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={loading}
                  data-testid="button-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {step === 1 ? "Carregando..." : "Criando..."}
                    </>
                  ) : (
                    step === 1 ? "Continuar" : "Criar meu negócio"
                  )}
                </Button>
              </div>

              {step === 1 && (
                <p className="text-center text-sm text-muted-foreground">
                  Já tem uma conta?{" "}
                  <a href="/login" className="text-primary hover:underline">
                    Fazer login
                  </a>
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
