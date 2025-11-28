import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import FuncionariosTable from "../components/funcionarios/FuncionariosTable";
import FuncionarioModal from "../components/funcionarios/FuncionarioModal";
import DeleteConfirmModal from "../components/funcionarios/DeleteConfirmModal";
import EmptyState from "../components/funcionarios/EmptyState";
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

export default function Funcionarios() {
  const [showModal, setShowModal] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState(null);
  const [deletingFuncionario, setDeletingFuncionario] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [cargoFilter, setCargoFilter] = useState("todos");
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();
  
  // Obter empresa do usuário logado
  const currentUser = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
  const empresaId = currentUser.empresa_id;

  const { data: funcionariosData = [], isLoading } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: () => base44.entities.Funcionario.list("-created_date"),
    initialData: [],
  });
  // Filtrar funcionários por empresa
  const funcionarios = Array.isArray(funcionariosData) 
    ? funcionariosData.filter(f => f.empresa_id === empresaId)
    : [];

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Funcionario.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      setShowModal(false);
      setEditingFuncionario(null);
    },
    onError: () => {
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Funcionario.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      setShowModal(false);
      setEditingFuncionario(null);
    },
    onError: () => {
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Funcionario.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      setDeletingFuncionario(null);
    },
    onError: () => {
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Funcionario.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
    },
  });

  const handleSave = (data) => {
    if (editingFuncionario) {
      updateMutation.mutate({ id: editingFuncionario.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (funcionario) => {
    setEditingFuncionario(funcionario);
    setShowModal(true);
  };

  const handleDelete = () => {
    if (deletingFuncionario) {
      deleteMutation.mutate(deletingFuncionario.id);
    }
  };

  const handleToggleStatus = (funcionario) => {
    const newStatus = funcionario.status === "Ativo" ? "Inativo" : "Ativo";
    toggleStatusMutation.mutate({ id: funcionario.id, status: newStatus });
  };

  const filteredFuncionarios = funcionarios.filter((func) => {
    const matchesSearch = 
      func.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      func.telefone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "todos" || func.status === statusFilter;
    const matchesCargo = cargoFilter === "todos" || func.cargo === cargoFilter;
    
    return matchesSearch && matchesStatus && matchesCargo;
  });

  const activeFiltersCount = (statusFilter !== "todos" ? 1 : 0) + (cargoFilter !== "todos" ? 1 : 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-8"
      >
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Funcionários
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Gerencie os profissionais vinculados ao seu negócio.
        </p>
      </motion.div>

      {funcionarios.length === 0 && !isLoading ? (
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
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Cargo</label>
                        <Select value={cargoFilter} onValueChange={setCargoFilter}>
                          <SelectTrigger className="border-purple-200">
                            <SelectValue placeholder="Cargo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="Gerente">Gerente</SelectItem>
                            <SelectItem value="Atendente">Atendente</SelectItem>
                            <SelectItem value="Profissional">Profissional</SelectItem>
                            <SelectItem value="Administrador">Administrador</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
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
                    setEditingFuncionario(null);
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
                  placeholder="Buscar funcionário por nome ou telefone"
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
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={cargoFilter} onValueChange={setCargoFilter}>
                  <SelectTrigger className="w-36 border-purple-200">
                    <SelectValue placeholder="Cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Gerente">Gerente</SelectItem>
                    <SelectItem value="Atendente">Atendente</SelectItem>
                    <SelectItem value="Profissional">Profissional</SelectItem>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => {
                    setEditingFuncionario(null);
                    setShowModal(true);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Funcionário
                </Button>
              </div>
            </div>
          </motion.div>

          <FuncionariosTable
            funcionarios={filteredFuncionarios}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={setDeletingFuncionario}
            onToggleStatus={handleToggleStatus}
          />
        </>
      )}

      <AnimatePresence>
        {showModal && (
          <FuncionarioModal
            funcionario={editingFuncionario}
            onSave={handleSave}
            onClose={() => {
              setShowModal(false);
              setEditingFuncionario(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        )}

        {deletingFuncionario && (
          <DeleteConfirmModal
            funcionario={deletingFuncionario}
            onConfirm={handleDelete}
            onCancel={() => setDeletingFuncionario(null)}
            isLoading={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}