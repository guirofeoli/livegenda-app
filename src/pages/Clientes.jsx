import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import ClientesTable from "../components/clientes/ClientesTable";
import ClienteModal from "../components/clientes/ClienteModal";
import DeleteConfirmModal from "../components/clientes/DeleteConfirmModal";
import EmptyState from "../components/clientes/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Clientes() {
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [deletingCliente, setDeletingCliente] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [frequenciaFilter, setFrequenciaFilter] = useState("todos");
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();
  
  // Obter empresa do usuário logado
  const currentUser = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
  const empresaId = currentUser.empresa_id;

  const { data: clientesData = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list("-created_date"),
    initialData: [],
  });
  
  // Filtrar clientes que têm agendamentos na empresa
  const { data: agendamentosData = [] } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => base44.entities.Agendamento.list(),
    initialData: [],
  });
  
  const clientesIdsNaEmpresa = new Set(
    agendamentosData
      .filter(a => a.empresa_id === empresaId)
      .map(a => a.cliente_id)
  );
  
  const clientes = Array.isArray(clientesData) 
    ? clientesData.filter(c => clientesIdsNaEmpresa.has(c.id))
    : [];

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Cliente.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setShowModal(false);
      setEditingCliente(null);
    },
    onError: () => {
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cliente.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setShowModal(false);
      setEditingCliente(null);
    },
    onError: () => {
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Cliente.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setDeletingCliente(null);
    },
    onError: () => {
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Cliente.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });

  const handleSave = (data) => {
    if (editingCliente) {
      updateMutation.mutate({ id: editingCliente.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setShowModal(true);
  };

  const handleDelete = () => {
    if (deletingCliente) {
      deleteMutation.mutate(deletingCliente.id);
    }
  };

  const handleToggleStatus = (cliente) => {
    const newStatus = cliente.status === "Ativa" ? "Inativa" : "Ativa";
    toggleStatusMutation.mutate({ id: cliente.id, status: newStatus });
  };

  const filteredClientes = clientes.filter((cliente) => {
    const matchesSearch = 
      cliente.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "todos" || cliente.status === statusFilter;
    const matchesFrequencia = frequenciaFilter === "todos" || cliente.frequencia === frequenciaFilter;
    
    return matchesSearch && matchesStatus && matchesFrequencia;
  });

  const activeFiltersCount = (statusFilter !== "todos" ? 1 : 0) + (frequenciaFilter !== "todos" ? 1 : 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-8"
      >
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Clientes
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Gerencie todas as clientes cadastradas no Livegenda.
        </p>
      </motion.div>

      {clientes.length === 0 && !isLoading ? (
        <EmptyState onAddClick={() => setShowModal(true)} />
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-purple-100/50 p-4 md:p-6 mb-4 md:mb-6"
          >
            {/* Mobile Layout */}
            <div className="md:hidden space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por nome ou telefone"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              
              <div className="flex gap-2">
                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="flex-1 border-purple-200 relative">
                      <Filter className="w-4 h-4 mr-2" />
                      Filtros
                      {activeFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-auto">
                    <SheetHeader>
                      <SheetTitle>Filtros</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Status</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="border-purple-200">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="Ativa">Ativa</SelectItem>
                            <SelectItem value="Inativa">Inativa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Frequência</label>
                        <Select value={frequenciaFilter} onValueChange={setFrequenciaFilter}>
                          <SelectTrigger className="border-purple-200">
                            <SelectValue placeholder="Frequência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todas</SelectItem>
                            <SelectItem value="Alta">Alta</SelectItem>
                            <SelectItem value="Média">Média</SelectItem>
                            <SelectItem value="Baixa">Baixa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        onClick={() => setShowFilters(false)}
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                      >
                        Aplicar Filtros
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>

                <Button
                  onClick={() => {
                    setEditingCliente(null);
                    setShowModal(true);
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex-1 w-full lg:max-w-md relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar cliente por nome ou telefone"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              
              <div className="flex gap-3 w-full lg:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 border-purple-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Ativa">Ativa</SelectItem>
                    <SelectItem value="Inativa">Inativa</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={frequenciaFilter} onValueChange={setFrequenciaFilter}>
                  <SelectTrigger className="w-36 border-purple-200">
                    <SelectValue placeholder="Frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => {
                    setEditingCliente(null);
                    setShowModal(true);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Cliente
                </Button>
              </div>
            </div>
          </motion.div>

          <ClientesTable
            clientes={filteredClientes}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={setDeletingCliente}
            onToggleStatus={handleToggleStatus}
          />
        </>
      )}

      <AnimatePresence>
        {showModal && (
          <ClienteModal
            cliente={editingCliente}
            onSave={handleSave}
            onClose={() => {
              setShowModal(false);
              setEditingCliente(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        )}

        {deletingCliente && (
          <DeleteConfirmModal
            cliente={deletingCliente}
            onConfirm={handleDelete}
            onCancel={() => setDeletingCliente(null)}
            isLoading={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}