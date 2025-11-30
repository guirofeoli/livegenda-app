import React, { useState } from "react";
import { livegenda } from "@/api/livegendaClient";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ClienteSearch({ selectedCliente, onSelectCliente, onNewCliente }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);

  const { data: clientesData = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => livegenda.entities.Cliente.list("-created_date"),
    initialData: [],
  });
  const clientes = Array.isArray(clientesData) ? clientesData : [];

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone?.includes(searchTerm)
  ).slice(0, 5);

  const handleSelectCliente = (cliente) => {
    onSelectCliente(cliente);
    setSearchTerm(cliente.nome_completo);
    setShowResults(false);
  };

  return (
    <div className="bg-white rounded-xl border border-purple-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Informações da Cliente
      </h3>
      
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar cliente existente"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            className="pl-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
          />
          
          {showResults && searchTerm && filteredClientes.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-purple-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {filteredClientes.map((cliente) => (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => handleSelectCliente(cliente)}
                  className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors flex items-center gap-3 border-b border-purple-50 last:border-0"
                >
                  {cliente.foto_url ? (
                    <img
                      src={cliente.foto_url}
                      alt={cliente.nome_completo}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{cliente.nome_completo}</p>
                    <p className="text-sm text-gray-500">{cliente.telefone}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          onClick={onNewCliente}
          className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Cadastrar nova cliente
        </Button>
      </div>

      {selectedCliente && (
        <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200 flex items-center gap-3">
          {selectedCliente.foto_url ? (
            <img
              src={selectedCliente.foto_url}
              alt={selectedCliente.nome_completo}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{selectedCliente.nome_completo}</p>
            <p className="text-sm text-gray-600">{selectedCliente.telefone}</p>
          </div>
        </div>
      )}
    </div>
  );
}
