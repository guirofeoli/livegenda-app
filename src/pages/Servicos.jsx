import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

import ServicosTable from "../components/servicos/ServicosTable";
import ServicoModal from "../components/servicos/ServicoModal";
import DeleteConfirmModal from "../components/servicos/DeleteConfirmModal";
import EmptyState from "../components/servicos/EmptyState";

export default function Servicos() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingServico, setEditingServico] = useState(null);
  const [deletingServico, setDeletingServico] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const currentUser = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
  const empresaId = currentUser.empresa_id;

  const { data: servicosData = [], isLoading } = useQuery({
    queryKey: ['servicos'],
    queryFn: () => base44.entities.Servico.list("-created_date"),
    initialData: [],
  });
  
  const servicos = Array.isArray(servicosData) 
    ? servicosData.filter(s => s.empresa_id === empresaId)
    : [];

  const createServicoMutation = useMutation({
    mutationFn: (data) => base44.entities.Servico.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      setShowModal(false);
      toast({
        title: "Serviço cadastrado",
        description: "O serviço foi adicionado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao cadastrar serviço",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateServicoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Servico.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      setShowModal(false);
      setEditingServico(null);
      toast({
        title: "Serviço atualizado",
        description: "As informações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar serviço",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteServicoMutation = useMutation({
    mutationFn: (id) => base44.entities.Servico.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      setDeletingServico(null);
      toast({
        title: "Serviço excluído",
        description: "O serviço foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir serviço",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (servico) => {
    setEditingServico(servico);
    setShowModal(true);
  };

  const handleDelete = (servico) => {
    setDeletingServico(servico);
  };

  const handleSave = (data) => {
    if (editingServico) {
      updateServicoMutation.mutate({ id: editingServico.id, data });
    } else {
      createServicoMutation.mutate(data);
    }
  };

  const handleAddNew = () => {
    setEditingServico(null);
    setShowModal(true);
  };

  const filteredServicos = servicos.filter(servico => {
    return servico.nome?.toLowerCase().includes(searchTerm.toLowerCase());
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
            Serviços
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Gerencie os serviços oferecidos
          </p>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30 w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Serviço
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>
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
        ) : filteredServicos.length === 0 ? (
          <EmptyState onAddNew={handleAddNew} searchTerm={searchTerm} />
        ) : (
          <ServicosTable
            servicos={filteredServicos}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <ServicoModal
            servico={editingServico}
            onSave={handleSave}
            onClose={() => {
              setShowModal(false);
              setEditingServico(null);
            }}
            isLoading={createServicoMutation.isPending || updateServicoMutation.isPending}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingServico && (
          <DeleteConfirmModal
            servico={deletingServico}
            onConfirm={() => deleteServicoMutation.mutate(deletingServico.id)}
            onCancel={() => setDeletingServico(null)}
            isLoading={deleteServicoMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
