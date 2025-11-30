import React, { useState } from "react";
import { livegenda } from "@/api/livegendaClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Briefcase } from "lucide-react";

export default function MeuPerfil() {
  const queryClient = useQueryClient();
  const currentUser = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
  const funcionarioId = currentUser.funcionario_id;

  const { data: funcionariosData = [] } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: () => livegenda.entities.Funcionario.list(),
    initialData: [],
  });

  const funcionario = funcionariosData.find(f => f.id === funcionarioId) || {};

  const [formData, setFormData] = useState({
    nome_completo: funcionario.nome_completo || '',
    email: funcionario.email || '',
    telefone: funcionario.telefone || '',
    cargo: funcionario.cargo || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => livegenda.entities.Funcionario.update(funcionarioId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
    },
    onError: () => {
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
        {/* Foto de Perfil */}
        <Card className="border-purple-100 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Foto de Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-white font-bold text-5xl">
                {formData.nome_completo?.charAt(0) || 'F'}
              </span>
            </div>
            <p className="text-sm text-gray-600 text-center mb-4">
              A foto de perfil é gerada automaticamente com base na primeira letra do seu nome
            </p>
          </CardContent>
        </Card>

        {/* Informações Pessoais */}
        <Card className="border-purple-100 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome_completo" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-600" />
                  Nome Completo
                </Label>
                <Input
                  id="nome_completo"
                  name="nome_completo"
                  value={formData.nome_completo}
                  onChange={handleChange}
                  className="border-purple-200 focus:border-purple-500"
                  required
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  Cargo
                </Label>
                <Input
                  id="cargo"
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleChange}
                  className="border-purple-200 focus:border-purple-500"
                  disabled
                />
                <p className="text-xs text-gray-500">
                  O cargo é definido pelo gestor da empresa
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  disabled={updateMutation.isPending}
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

