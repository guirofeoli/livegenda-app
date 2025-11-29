import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Phone, Mail, MapPin, Clock } from "lucide-react";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar campos obrigatórios
      if (!formData.nomeNegocio || !formData.telefone || !formData.email || !formData.categoria) {
        setLoading(false);
        return;
      }

      // Criar nova empresa
      const empresas = JSON.parse(localStorage.getItem('empresas') || '[]');
      const novaEmpresa = {
        id: Date.now().toString(),
        nome: formData.nomeNegocio,
        categoria: formData.categoria,
        cnpj: '',
        telefone: formData.telefone,
        email: formData.email,
        endereco: formData.endereco,
        horarioFuncionamento: formData.horarioFuncionamento,
        intervaloAgendamento: formData.intervaloAgendamento,
        lembreteAutomatico: formData.lembreteAutomatico,
        tempoAntecedenciaLembrete: formData.tempoAntecedenciaLembrete,
        createdAt: new Date().toISOString()
      };
      
      empresas.push(novaEmpresa);
      localStorage.setItem('empresas', JSON.stringify(empresas));

      // Atualizar usuário logado com empresa_id e tipo gestor
      const user = JSON.parse(localStorage.getItem('livegenda_user'));
      user.empresa_id = novaEmpresa.id;
      user.tipo = 'gestor';
      localStorage.setItem('livegenda_user', JSON.stringify(user));
      
      // Atualizar usuário na lista de usuários
      const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
      const usuarioIndex = usuarios.findIndex(u => u.id === user.id);
      if (usuarioIndex !== -1) {
        usuarios[usuarioIndex].empresa_id = novaEmpresa.id;
        usuarios[usuarioIndex].tipo = 'gestor';
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
      }

      navigate('/agendamentos');
    } catch (err) {
    }
    
    setLoading(false);
  };

  const handleHorarioChange = (dia, field, value) => {
    setFormData(prev => ({
      ...prev,
      horarioFuncionamento: {
        ...prev.horarioFuncionamento,
        [dia]: {
          ...prev.horarioFuncionamento[dia],
          [field]: value
        }
      }
    }));
  };

  const diasSemana = [
    { key: 'segunda', label: 'Segunda-feira' },
    { key: 'terca', label: 'Terça-feira' },
    { key: 'quarta', label: 'Quarta-feira' },
    { key: 'quinta', label: 'Quinta-feira' },
    { key: 'sexta', label: 'Sexta-feira' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 p-4">
      <Card className="w-full max-w-3xl shadow-xl border-purple-100">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-2xl font-bold text-white">L</span>
            </div>
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
            Bem-vindo ao Livegenda!
          </CardTitle>
          <CardDescription className="text-base text-gray-600 mt-2">
            Configure seu estabelecimento para começar a usar o sistema de agendamentos
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Informações do Estabelecimento
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeNegocio">Nome do Estabelecimento *</Label>
                  <Input
                    id="nomeNegocio"
                    value={formData.nomeNegocio}
                    onChange={(e) => setFormData({ ...formData, nomeNegocio: e.target.value })}
                    placeholder="Ex: Salão Beleza Total"
                    className="border-purple-200 focus:border-purple-500"
                    required
                    data-testid="input-nome-negocio"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria do Negócio *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                    required
                  >
                    <SelectTrigger 
                      className="border-purple-200 focus:border-purple-500"
                      data-testid="select-categoria"
                    >
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
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Phone className="w-5 h-5 text-purple-600" />
                Informações de Contato
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">WhatsApp / Telefone *</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="border-purple-200 focus:border-purple-500"
                    required
                    data-testid="input-telefone"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@exemplo.com"
                    className="border-purple-200 focus:border-purple-500"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço (opcional)</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, bairro, cidade"
                  className="border-purple-200 focus:border-purple-500"
                  data-testid="input-endereco"
                />
              </div>
            </div>

            {/* Horário de Funcionamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Horário de Funcionamento
              </h3>
              
              <div className="space-y-3">
                {diasSemana.map(({ key, label }) => (
                  <div 
                    key={key} 
                    className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 py-2 border-b border-purple-50 last:border-0"
                  >
                    <div className="flex items-center justify-between md:w-48">
                      <span className="font-medium text-gray-700">{label}</span>
                      <Switch
                        checked={formData.horarioFuncionamento[key].ativo}
                        onCheckedChange={(checked) => handleHorarioChange(key, 'ativo', checked)}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>
                    
                    {formData.horarioFuncionamento[key].ativo && (
                      <div className="flex items-center gap-2 md:gap-3 flex-1">
                        <Input
                          type="time"
                          value={formData.horarioFuncionamento[key].inicio}
                          onChange={(e) => handleHorarioChange(key, 'inicio', e.target.value)}
                          className="flex-1 md:w-32 border-purple-200 focus:border-purple-500"
                        />
                        <span className="text-gray-500">até</span>
                        <Input
                          type="time"
                          value={formData.horarioFuncionamento[key].fim}
                          onChange={(e) => handleHorarioChange(key, 'fim', e.target.value)}
                          className="flex-1 md:w-32 border-purple-200 focus:border-purple-500"
                        />
                      </div>
                    )}
                    
                    {!formData.horarioFuncionamento[key].ativo && (
                      <span className="text-sm text-gray-500 italic">Fechado</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Configurações de Agendamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Configurações de Agendamento</h3>
              
              <div className="space-y-2">
                <Label htmlFor="intervaloAgendamento">Intervalo entre agendamentos (minutos)</Label>
                <Input
                  id="intervaloAgendamento"
                  type="number"
                  value={formData.intervaloAgendamento}
                  onChange={(e) => setFormData({ ...formData, intervaloAgendamento: parseInt(e.target.value) })}
                  min="15"
                  step="15"
                  className="border-purple-200 focus:border-purple-500"
                  data-testid="input-intervalo"
                />
                <p className="text-xs text-gray-500">
                  Define o intervalo mínimo entre os horários disponíveis
                </p>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30 py-6 text-lg" 
              disabled={loading}
              data-testid="button-submit-onboarding"
            >
              {loading ? 'Salvando...' : 'Começar a usar o Livegenda'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
