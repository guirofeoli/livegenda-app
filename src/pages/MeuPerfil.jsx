import { useState, useEffect } from "react";
import { livegenda } from "@/api/livegendaClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Building2, Shield } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function MeuPerfil() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
  const currentEmpresa = JSON.parse(localStorage.getItem('livegenda_empresa') || '{}');
  const funcionarioId = currentUser.funcionario_id;
  const isFuncionario = currentUser.tipo === 'funcionario';

  const { data: funcionariosData = [] } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: () => livegenda.entities.Funcionario.list(),
    initialData: [],
    enabled: isFuncionario && !!funcionarioId,
  });

  const funcionario = funcionariosData.find(f => f.id === funcionarioId);

  const [formData, setFormData] = useState({
    nome: currentUser.nome || '',
    email: currentUser.email || '',
    telefone: isFuncionario ? (funcionario?.telefone || '') : (currentEmpresa.telefone || currentUser.telefone || ''),
  });

  useEffect(() => {
    if (isFuncionario && funcionario) {
      setFormData({
        nome: funcionario.nome || currentUser.nome || '',
        email: funcionario.email || currentUser.email || '',
        telefone: funcionario.telefone || '',
      });
    } else {
      setFormData({
        nome: currentUser.nome || '',
        email: currentUser.email || '',
        telefone: currentEmpresa.telefone || '',
      });
    }
  }, [funcionario, currentUser.nome, currentUser.email, isFuncionario]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (isFuncionario && funcionarioId) {
        return livegenda.entities.Funcionario.update(funcionarioId, {
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
        });
      } else {
        const response = await fetch(`/api/usuarios/${currentUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: data.nome,
            email: data.email,
          }),
        });
        if (!response.ok) throw new Error('Erro ao atualizar perfil');
        return response.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      const updatedUser = { ...currentUser, nome: formData.nome, email: formData.email };
      localStorage.setItem('livegenda_user', JSON.stringify(updatedUser));
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao atualizar o perfil.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getInitial = () => {
    return formData.nome?.charAt(0)?.toUpperCase() || currentUser.email?.charAt(0)?.toUpperCase() || 'U';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Meu Perfil
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Gerencie suas informações pessoais
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-purple-100 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Foto de Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-white font-bold text-5xl">
                {getInitial()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>{isFuncionario ? 'Funcionário' : 'Gestor'}</span>
            </div>
            {currentEmpresa.nome && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Building2 className="w-4 h-4" />
                <span>{currentEmpresa.nome}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-purple-100 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-600" />
                  Nome
                </Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className="border-purple-200 focus:border-purple-500"
                  required
                  data-testid="input-nome"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-600" />
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="border-purple-200 focus:border-purple-500"
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-purple-600" />
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  className="border-purple-200 focus:border-purple-500"
                  placeholder="(00) 00000-0000"
                  data-testid="input-telefone"
                  disabled={!isFuncionario}
                />
                {!isFuncionario && (
                  <p className="text-xs text-gray-500">
                    O telefone do gestor é definido nas configurações da empresa
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  disabled={updateMutation.isPending}
                  data-testid="button-salvar-perfil"
                >
                  {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
