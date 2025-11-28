import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();
  
  const currentUser = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
  const empresaId = currentUser.empresa_id;

  const { data: clientesData = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => base44.entities.Cliente.list(),
    initialData: [],
  });
  
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
      toast({
        title: "Cliente cadastrado",
        description: "O cliente foi adicionado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao cadastrar cliente",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Cliente.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setShowModal(false);
      setEditingCliente(null);
      toast({
        title: "Cliente atualizado",
        description: "As informações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Cliente.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setDeletingCliente(null);
      toast({
        title: "Cliente excluído",
        description: "O cliente foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir cliente",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Cliente.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({
        title: "Status atualizado",
        description: "O status do cliente foi alterado.",
      });
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

  const handleDelete = (cliente) => {
    setDeletingCliente(cliente);
  };

  const handleToggleStatus = (cliente) => {
    const newStatus = cliente.status === "Ativo" ? "Inativo" : "Ativo";
    toggleStatusMutation.mutate({ id: cliente.id, status: newStatus });
  };

  const handleAddNew = () => {
    setEditingCliente(null);
    setShowModal(true);
  };

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = 
      cliente.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone?.includes(searchTerm) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || cliente.status === statusFilter;
    const matchesFrequencia = frequenciaFilter === "todos" || cliente.frequencia === frequenciaFilter;
    
    return matchesSearch && matchesStatus && matchesFrequencia;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8"
      >
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
            Clientes
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Gerencie sua base de clientes
          </p>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30 w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Cliente
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-3 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>
        
        <div className="hidden md:flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] border-purple-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Ativo">Ativos</SelectItem>
              <SelectItem value="Inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={frequenciaFilter} onValueChange={setFrequenciaFilter}>
            <SelectTrigger className="w-[150px] border-purple-200">
              <SelectValue placeholder="Frequência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="Frequente">Frequentes</SelectItem>
              <SelectItem value="Ocasional">Ocasionais</SelectItem>
              <SelectItem value="Novo">Novos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetTrigger asChild>
            <Button variant="outline" className="md:hidden border-purple-200">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full border-purple-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Ativo">Ativos</SelectItem>
                    <SelectItem value="Inativo">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Frequência</label>
                <Select value={frequenciaFilter} onValueChange={setFrequenciaFilter}>
                  <SelectTrigger className="w-full border-purple-200">
                    <SelectValue placeholder="Frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="Frequente">Frequentes</SelectItem>
                    <SelectItem value="Ocasional">Ocasionais</SelectItem>
                    <SelectItem value="Novo">Novos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredClientes.length === 0 ? (
          <EmptyState onAddNew={handleAddNew} searchTerm={searchTerm} />
        ) : (
          <ClientesTable
            clientes={filteredClientes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </motion.div>

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
      </AnimatePresence>

      <AnimatePresence>
        {deletingCliente && (
          <DeleteConfirmModal
            cliente={deletingCliente}
            onConfirm={() => deleteMutation.mutate(deletingCliente.id)}
            onCancel={() => setDeletingCliente(null)}
            isLoading={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
