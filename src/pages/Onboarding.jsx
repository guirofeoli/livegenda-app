import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nomeNegocio: '',
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
      if (!formData.nomeNegocio || !formData.telefone || !formData.email) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Por favor, preencha todos os campos obrigatórios',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      // Criar nova empresa
      const empresas = JSON.parse(localStorage.getItem('empresas') || '[]');
      const novaEmpresa = {
        id: Date.now().toString(),
        nome: formData.nomeNegocio,
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

      // Atualizar usuário logado com empresa_id
      const user = JSON.parse(localStorage.getItem('livegenda_user'));
      user.empresa_id = novaEmpresa.id;
      localStorage.setItem('livegenda_user', JSON.stringify(user));
      
      // Atualizar usuário na lista de usuários
      const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
      const usuarioIndex = usuarios.findIndex(u => u.id === user.id);
      if (usuarioIndex !== -1) {
        usuarios[usuarioIndex].empresa_id = novaEmpresa.id;
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
      }

      toast({
        title: 'Empresa cadastrada!',
        description: 'Bem-vindo ao Livegenda'
      });

      navigate('/agendamentos');
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao cadastrar a empresa',
        variant: 'destructive'
      });
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
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">L</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Bem-vindo ao Livegenda!</CardTitle>
          <CardDescription className="text-center">
            Vamos configurar sua empresa para começar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações da Empresa</h3>
              
              <div className="space-y-2">
                <Label htmlFor="nomeNegocio">Nome do Negócio *</Label>
                <Input
                  id="nomeNegocio"
                  value={formData.nomeNegocio}
                  onChange={(e) => setFormData({ ...formData, nomeNegocio: e.target.value })}
                  placeholder="Salão Beleza"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 3456-7890"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@salao.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua das Flores, 123 - São Paulo/SP"
                />
              </div>
            </div>

            {/* Horário de Funcionamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Horário de Funcionamento</h3>
              
              <div className="space-y-3">
                {diasSemana.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 w-32">
                      <Switch
                        checked={formData.horarioFuncionamento[key].ativo}
                        onCheckedChange={(checked) => handleHorarioChange(key, 'ativo', checked)}
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                    
                    {formData.horarioFuncionamento[key].ativo && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={formData.horarioFuncionamento[key].inicio}
                          onChange={(e) => handleHorarioChange(key, 'inicio', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-gray-500">até</span>
                        <Input
                          type="time"
                          value={formData.horarioFuncionamento[key].fim}
                          onChange={(e) => handleHorarioChange(key, 'fim', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    )}
                    
                    {!formData.horarioFuncionamento[key].ativo && (
                      <span className="text-sm text-gray-500">Fechado</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Configurações de Agendamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configurações de Agendamento</h3>
              
              <div className="space-y-2">
                <Label htmlFor="intervaloAgendamento">Intervalo entre agendamentos (minutos)</Label>
                <Input
                  id="intervaloAgendamento"
                  type="number"
                  value={formData.intervaloAgendamento}
                  onChange={(e) => setFormData({ ...formData, intervaloAgendamento: parseInt(e.target.value) })}
                  min="15"
                  step="15"
                />
                <p className="text-xs text-gray-500">
                  Define o intervalo mínimo entre os horários disponíveis
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Salvando...' : 'Começar a usar o Livegenda'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
