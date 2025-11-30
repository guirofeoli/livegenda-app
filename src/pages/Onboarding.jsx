import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Phone, Mail, MapPin, Clock, Loader2 } from "lucide-react";

const API_BASE = '';

const CATEGORIAS_EMPRESA = [
  { value: 'salao_beleza', label: 'Salão de Beleza' },
  { value: 'barbearia', label: 'Barbearia' },
  { value: 'clinica_estetica', label: 'Clínica de Estética' },
  { value: 'spa', label: 'SPA' },
  { value: 'studio_unhas', label: 'Studio de Unhas' },
  { value: 'sobrancelhas', label: 'Design de Sobrancelhas' },
  { value: 'makeup', label: 'Maquiagem' },
  { value: 'massagem', label: 'Massagem' },
  { value: 'outro', label: 'Outro' }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    nomeNegocio: '',
    categoria: '',
    telefone: '',
    email: '',
    endereco: '',
    horarioFuncionamento: {
      segunda: { inicio: '09:00', fim: '18:00', ativo: true },
      terca: { inicio: '09:00', fim: '18:00', ativo: true },
      quarta: { inicio: '09:00', fim: '18:00', ativo: true },
      quinta: { inicio: '09:00', fim: '18:00', ativo: true },
      sexta: { inicio: '09:00', fim: '18:00', ativo: true },
      sabado: { inicio: '09:00', fim: '14:00', ativo: true },
      domingo: { inicio: '09:00', fim: '14:00', ativo: false }
    },
    intervaloAgendamento: 30,
    lembreteAutomatico: true,
    tempoAntecedenciaLembrete: 24
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('livegenda_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      // Preencher email do usuário
      setFormData(prev => ({ ...prev, email: userData.email || '' }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validar campos obrigatórios
      if (!formData.nomeNegocio || !formData.telefone || !formData.categoria) {
        setError('Preencha todos os campos obrigatórios');
        setLoading(false);
        return;
      }

      // Criar empresa via API
      const response = await fetch(`${API_BASE}/api/empresas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nomeNegocio,
          tipo: formData.categoria,
          telefone: formData.telefone,
          email: formData.email,
          endereco: formData.endereco
        })
      });
      
      const empresaData = await response.json();
      
      if (!response.ok) {
        setError(empresaData.error || 'Erro ao criar empresa');
        setLoading(false);
        return;
      }

      // Atualizar usuário com empresa_id via API
      if (user && user.id) {
        // Buscar usuário atual e atualizar
        const updateResponse = await fetch(`${API_BASE}/api/usuarios/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empresa_id: empresaData.id
          })
        });
        
        // Atualizar localStorage com dados da empresa
        const updatedUser = { ...user, empresa_id: empresaData.id };
        localStorage.setItem('livegenda_user', JSON.stringify(updatedUser));
        localStorage.setItem('livegenda_empresa', JSON.stringify(empresaData));
      }

      navigate('/agendamentos');
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    }
    
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Configure seu negócio</CardTitle>
            <CardDescription>
              Preencha as informações da sua empresa para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome do Negócio */}
              <div className="space-y-2">
                <Label htmlFor="nomeNegocio">Nome do Negócio *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="nomeNegocio"
                    placeholder="Ex: Salão da Maria"
                    value={formData.nomeNegocio}
                    onChange={(e) => handleInputChange('nomeNegocio', e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="categoria">Tipo de Negócio *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => handleInputChange('categoria', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
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

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="telefone"
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="contato@empresa.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="endereco"
                    placeholder="Rua, número, bairro, cidade"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange('endereco', e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar meu negócio'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
