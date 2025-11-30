import React from "react";
import { livegenda } from "@/api/livegendaClient";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ServicoSelect({ selectedServico, onSelectServico, duracao, preco, onDuracaoChange, onPrecoChange }) {
  const currentUser = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
  const empresaId = currentUser.empresa_id;
  
  const { data: servicosData = [] } = useQuery({
    queryKey: ['servicos'],
    queryFn: () => livegenda.entities.Servico.list(),
    initialData: [],
  });
  const servicos = Array.isArray(servicosData) 
    ? servicosData.filter(s => s.empresa_id === empresaId)
    : [];

  const handleServicoChange = (servicoId) => {
    const servico = servicos.find((s) => s.id === servicoId);
    if (servico) {
      onSelectServico(servico);
      onDuracaoChange(servico.duracao_minutos);
      onPrecoChange(parseFloat(servico.preco) || 0);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-purple-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Detalhes do Serviço
      </h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="servico" className="text-gray-700">
            Serviço
          </Label>
          <Select
            value={selectedServico?.id || ""}
            onValueChange={handleServicoChange}
          >
            <SelectTrigger className="border-purple-200 focus:border-purple-500 focus:ring-purple-500">
              <SelectValue placeholder="Selecionar tipo de serviço" />
            </SelectTrigger>
            <SelectContent>
              {servicos.map((servico) => (
                <SelectItem key={servico.id} value={servico.id}>
                  {servico.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duracao" className="text-gray-700">
              Duração (minutos)
            </Label>
            <Input
              id="duracao"
              type="number"
              value={duracao || ""}
              onChange={(e) => onDuracaoChange(Number(e.target.value))}
              placeholder="45"
              className="border-purple-200 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preco" className="text-gray-700">
              Preço (R$)
            </Label>
            <Input
              id="preco"
              type="number"
              step="0.01"
              value={preco || ""}
              onChange={(e) => onPrecoChange(Number(e.target.value))}
              placeholder="90,00"
              className="border-purple-200 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
