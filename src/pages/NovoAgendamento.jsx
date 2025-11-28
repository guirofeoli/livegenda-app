
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import ClienteSearch from "../components/agendamento/ClienteSearch";
import ServicoSelect from "../components/agendamento/ServicoSelect";
import ProfissionalSelect from "../components/agendamento/ProfissionalSelect";
import DateTimePicker from "../components/agendamento/DateTimePicker";
import ConfirmacaoSection from "../components/agendamento/ConfirmacaoSection";
import ClienteModal from "../components/clientes/ClienteModal";

export default function NovoAgendamento() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Obter empresa do usuário logado
  const currentUser = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
  const empresaId = currentUser.empresa_id;

  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedServico, setSelectedServico] = useState(null);
  const [duracao, setDuracao] = useState(null);
  const [preco, setPreco] = useState(null);
  const [selectedProfissional, setSelectedProfissional] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Changed from null to new Date()
  const [selectedTime, setSelectedTime] = useState(null);
  const [showClienteModal, setShowClienteModal] = useState(false);
  
  const [formData, setFormData] = useState({
    observacoes: "",
    enviar_whatsapp: true,
    sincronizar_google: true,
  });

  // Mock: Mariana Costa sem horário às 15:00 no dia 15/11/2025
  const horariosIndisponiveis = [
    { data: "2025-11-15", hora: "15:00" }, // Updated mock data
  ];

  const createClienteMutation = useMutation({
    mutationFn: (data) => base44.entities.Cliente.create(data),
    onSuccess: (newCliente) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setSelectedCliente(newCliente);
      setShowClienteModal(false);
    },
    onError: () => {
    },
  });

  const createAgendamentoMutation = useMutation({
    mutationFn: (data) => base44.entities.Agendamento.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      navigate("/");
    },
    onError: () => {
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedCliente) {
      return;
    }
    if (!selectedServico) {
      return;
    }
    if (!duracao || !preco) {
      return;
    }
    if (!selectedProfissional) {
      return;
    }
    if (!selectedDate || !selectedTime) {
      return;
    }

    const agendamentoData = {
      empresa_id: empresaId,
      cliente_id: selectedCliente.id,
      servico_id: selectedServico.id,
      funcionario_id: selectedProfissional.id,
      data: selectedDate.toISOString().split('T')[0],
      hora_inicio: selectedTime,
      duracao_minutos: duracao,
      preco: preco,
      observacoes: formData.observacoes,
      enviar_whatsapp: formData.enviar_whatsapp,
      sincronizar_google: formData.sincronizar_google,
      status: "Agendado",
    };

    createAgendamentoMutation.mutate(agendamentoData);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-8"
      >
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Novo Agendamento
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Preencha as informações abaixo para confirmar o horário da cliente.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ClienteSearch
            selectedCliente={selectedCliente}
            onSelectCliente={setSelectedCliente}
            onNewCliente={() => setShowClienteModal(true)}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ServicoSelect
            selectedServico={selectedServico}
            onSelectServico={setSelectedServico}
            duracao={duracao}
            preco={preco}
            onDuracaoChange={setDuracao}
            onPrecoChange={setPreco}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ProfissionalSelect
            selectedProfissional={selectedProfissional}
            onSelectProfissional={setSelectedProfissional}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <DateTimePicker
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelectDate={setSelectedDate}
            onSelectTime={setSelectedTime}
            funcionarioId={selectedProfissional?.id}
            duracaoServico={duracao}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ConfirmacaoSection
            formData={formData}
            onUpdateFormData={setFormData}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-3 justify-end pt-4"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/")}
            className="border-gray-300 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={createAgendamentoMutation.isPending}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30"
          >
            Confirmar Agendamento
          </Button>
        </motion.div>
      </form>

      <AnimatePresence>
        {showClienteModal && (
          <ClienteModal
            cliente={null}
            onSave={(data) => createClienteMutation.mutate(data)}
            onClose={() => setShowClienteModal(false)}
            isLoading={createClienteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
