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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [formData, setFormData] = useState({
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
    }
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
      setIsLoggedIn(true);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.nomeNegocio || !formData.telefone || !formData.categoria) {
        setError("Preencha todos os campos obrigatórios");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/vincular-empresa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          nomeNegocio: formData.nomeNegocio,
          categoria: formData.categoria,
          telefone: formData.telefone,
          endereco: formData.endereco || null
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Erro ao criar empresa");
        toast({
          title: "Erro",
          description: data.error || "Erro ao criar empresa",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      localStorage.setItem("livegenda_user", JSON.stringify(data.usuario));
      localStorage.setItem("livegenda_empresa", JSON.stringify(data.empresa));

      toast({
        title: "Sucesso!",
        description: "Seu negócio foi configurado com sucesso!",
      });

      navigate("/dashboard");

    } catch (err) {
      console.error("Erro no onboarding:", err);
      setError("Erro ao criar empresa. Tente novamente.");
      toast({
        title: "Erro",
        description: "Erro ao criar empresa. Tente novamente.",
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Configure seu negócio</CardTitle>
              <CardDescription>
                Você precisa fazer login primeiro
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4 text-muted-foreground">
                Para configurar seu negócio, faça login ou crie uma conta.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/login")}>
                  Fazer login
                </Button>
                <Button onClick={() => navigate("/register")}>
                  Criar conta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Configure seu negócio</CardTitle>
            <CardDescription>
              Olá, {user?.nome || ""}! Configure as informações do seu estabelecimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                data-testid="button-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar meu negócio"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
