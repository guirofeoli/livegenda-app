import React, { useState } from "react";
import { livegenda } from "@/api/livegendaClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

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

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const currentUser = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
  const empresaId = currentUser.empresa_id;

  const { data: funcionariosData = [], isLoading } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: () => livegenda.entities.Funcionario.list("-created_date"),
    staleTime: 0,
    refetchOnMount: true,
  });
  
  const { data: servicosData = [] } = useQuery({
    queryKey: ['servicos'],
    queryFn: () => livegenda.entities.Servico.list(),
    staleTime: 0,
  });
  
  const funcionarios = Array.isArray(funcionariosData) 
    ? funcionariosData.filter(f => f.empresa_id === empresaId)
    : [];
  
  const servicos = Array.isArray(servicosData) 
    ? servicosData.filter(s => s.empresa_id === empresaId)
    : [];

  const createMutation = useMutation({
    mutationFn: (data) => livegenda.entities.Funcionario.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      await queryClient.refetchQueries({ queryKey: ['funcionarios'] });
      setShowModal(false);
      setEditingFuncionario(null);
      toast({
        title: "Funcionário cadastrado",
        description: "O funcionário foi adicionado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao cadastrar funcionário",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => livegenda.entities.Funcionario.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      setShowModal(false);
      setEditingFuncionario(null);
      toast({
        title: "Funcionário atualizado",
        description: "As informações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar funcionário",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => livegenda.entities.Funcionario.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      setDeletingFuncionario(null);
      toast({
        title: "Funcionário excluído",
        description: "O funcionário foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir funcionário",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) => livegenda.entities.Funcionario.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      toast({
        title: "Status atualizado",
        description: "O status do funcionário foi alterado.",
      });
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

  const handleDelete = (funcionario) => {
    setDeletingFuncionario(funcionario);
  };

  const handleCreateAgendamento = (funcionario) => {
    navigate(`/novo-agendamento?funcionarioId=${funcionario.id}`);
  };

  const handleToggleStatus = (funcionario) => {
    const newStatus = funcionario.status === "Ativo" ? "Inativo" : "Ativo";
    toggleStatusMutation.mutate({ id: funcionario.id, status: newStatus });
  };

  const handleAddNew = () => {
    setEditingFuncionario(null);
    setShowModal(true);
  };

  const filteredFuncionarios = funcionarios.filter(funcionario => {
    const matchesSearch = 
      funcionario.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      funcionario.telefone?.includes(searchTerm) ||
      funcionario.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || funcionario.status === statusFilter;
    const matchesCargo = cargoFilter === "todos" || funcionario.cargo === cargoFilter;
    
    return matchesSearch && matchesStatus && matchesCargo;
  });

  const cargos = [...new Set(funcionarios.map(f => f.cargo).filter(Boolean))];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8"
      >
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
            Funcionários
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Gerencie sua equipe de profissionais
          </p>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30 w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Funcionário
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
          
          <Select value={cargoFilter} onValueChange={setCargoFilter}>
            <SelectTrigger className="w-[150px] border-purple-200">
              <SelectValue placeholder="Cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {cargos.map(cargo => (
                <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>
              ))}
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
                <label className="text-sm font-medium mb-2 block">Cargo</label>
                <Select value={cargoFilter} onValueChange={setCargoFilter}>
                  <SelectTrigger className="w-full border-purple-200">
                    <SelectValue placeholder="Cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {cargos.map(cargo => (
                      <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>
                    ))}
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
        ) : filteredFuncionarios.length === 0 ? (
          <EmptyState onAddNew={handleAddNew} searchTerm={searchTerm} />
        ) : (
          <FuncionariosTable
            funcionarios={filteredFuncionarios}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreateAgendamento={handleCreateAgendamento}
          />
        )}
      </motion.div>

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
            servicos={servicos}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingFuncionario && (
          <DeleteConfirmModal
            funcionario={deletingFuncionario}
            onConfirm={() => deleteMutation.mutate(deletingFuncionario.id)}
            onCancel={() => setDeletingFuncionario(null)}
            isLoading={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

