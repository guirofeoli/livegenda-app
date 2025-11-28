import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import ServicosTable from "../components/servicos/ServicosTable";
import ServicoModal from "../components/servicos/ServicoModal";
import DeleteConfirmModal from "../components/servicos/DeleteConfirmModal";
import EmptyState from "../components/servicos/EmptyState";

export default function Servicos() {
  const queryClient = useQueryClient();
  const [editingServico, setEditingServico] = useState(null);
  const [deletingServico, setDeletingServico] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Obter empresa do usuário logado
  const currentUser = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
  const empresaId = currentUser.empresa_id;

  const { data: servicosData = [], isLoading } = useQuery({
    queryKey: ['servicos'],
    queryFn: () => base44.entities.Servico.list("-created_date"),
    initialData: [],
  });
  // Filtrar serviços por empresa
  const servicos = Array.isArray(servicosData) 
    ? servicosData.filter(s => s.empresa_id === empresaId)
    : [];

  const createServicoMutation = useMutation({
    mutationFn: (data) => base44.entities.Servico.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      setShowModal(false);
    },
    onError: () => {
    },
  });

  const updateServicoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Servico.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      setShowModal(false);
      setEditingServico(null);
    },
    onError: () => {
    },
  });

  const deleteServicoMutation = useMutation({
    mutationFn: (id) => base44.entities.Servico.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] });
      setDeletingServico(null);
    },
    onError: () => {
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
        className="mb-6 md:mb-8"
      >
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Serviços
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Gerencie os serviços oferecidos pelo seu estabelecimento.
        </p>
      </motion.div>

      {servicos.length === 0 && !isLoading ? (
        <EmptyState onAddClick={handleAddNew} />
      ) : (
        <>
          {/* Mobile Layout */}
          <div className="md:hidden space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-purple-200 focus:border-purple-500"
              />
            </div>
            
            <Button
              onClick={handleAddNew}
              size="sm"
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Serviço
            </Button>
          </div>

          {/* Desktop Layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="hidden md:flex items-center justify-between mb-6 gap-4"
          >
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-purple-200 focus:border-purple-500"
              />
            </div>

            <Button
              onClick={handleAddNew}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Serviço
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ServicosTable
              servicos={filteredServicos}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          </motion.div>
        </>
      )}

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