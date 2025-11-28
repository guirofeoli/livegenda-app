import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProfissionalSelect({ selectedProfissional, onSelectProfissional }) {
  // Obter empresa do usuário logado
  const currentUser = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
  const empresaId = currentUser.empresa_id;
  
  const { data: funcionariosData = [] } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: () => base44.entities.Funcionario.filter({ status: "Ativo" }),
    initialData: [],
  });
  // Filtrar funcionários por empresa
  const funcionarios = Array.isArray(funcionariosData) 
    ? funcionariosData.filter(f => f.empresa_id === empresaId)
    : [];

  return (
    <div className="bg-white rounded-xl border border-purple-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Profissional
      </h3>
      
      <div className="space-y-2">
        <Label htmlFor="profissional" className="text-gray-700">
          Selecionar profissional
        </Label>
        <Select
          value={selectedProfissional?.id || ""}
          onValueChange={(id) => {
            const prof = funcionarios.find((f) => f.id === id);
            onSelectProfissional(prof);
          }}
        >
          <SelectTrigger className="border-purple-200 focus:border-purple-500 focus:ring-purple-500">
            <SelectValue placeholder="Selecione um profissional" />
          </SelectTrigger>
          <SelectContent>
            {funcionarios.map((funcionario) => (
              <SelectItem key={funcionario.id} value={funcionario.id}>
                {funcionario.nome_completo} - {funcionario.cargo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}