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

  // Clientes já são filtrados por empresa_id no mockClient
  const { data: clientesData = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
    initialData: [],
  });
  
  // Usar diretamente os dados filtrados
  const clientes = Array.isArray(clientesData) ? clientesData : [];

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Cliente.create({
      ...data,
      empresa_id: empresaId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setShowModal(false);
      setEditingCliente(null);
    },
    onError: (error) => {
      console.error('Erro ao criar cliente:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cliente.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setShowModal(false);
      setEditingCliente(null);
    },
    onError: (error) => {
      console.error('Erro ao atualizar cliente:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Cliente.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setDeletingCliente(null);
    },
    onError: (error) => {
      console.error('Erro ao excluir cliente:', error);
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
      cliente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone?.includes(searchTerm) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "todos" || cliente.status === statusFilter;

    const matchesFrequencia =
      frequenciaFilter === "todos" || cliente.frequencia === frequenciaFilter;

    return matchesSearch && matchesStatus && matchesFrequencia;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto overflow-x-hidden">
      {clientes.length === 0 && !isLoading ? (
        <EmptyState onAddClick={() => setShowModal(true)} />
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 md:mb-6"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  Clientes
                </h1>
                <p className="text-sm md:text-base text-gray-600">
                  Gerencie sua base de clientes ({clientes.length} cadastrados)
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64 border-purple-200 focus:border-purple-500"
                  />
                </div>

                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-purple-200 hover:bg-purple-50 md:hidden"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filtros
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filtros</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Status
                        </label>
                        <Select
                          value={statusFilter}
                          onValueChange={setStatusFilter}
                        >
                          <SelectTrigger className="border-purple-200">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="Ativa">Ativas</SelectItem>
                            <SelectItem value="Inativa">Inativas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Frequência
                        </label>
                        <Select
                          value={frequenciaFilter}
                          onValueChange={setFrequenciaFilter}
                        >
                          <SelectTrigger className="border-purple-200">
                            <SelectValue placeholder="Frequência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todas</SelectItem>
                            <SelectItem value="Semanal">Semanal</SelectItem>
                            <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                            <SelectItem value="Mensal">Mensal</SelectItem>
                            <SelectItem value="Esporádica">Esporádica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="hidden md:flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32 border-purple-200">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Ativa">Ativas</SelectItem>
                      <SelectItem value="Inativa">Inativas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
