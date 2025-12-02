import React, { useState, useEffect } from "react";
import { livegenda } from "@/api/livegendaClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

import ClienteSearch from "../components/agendamento/ClienteSearch";
import ServicoSelect from "../components/agendamento/ServicoSelect";
import ProfissionalSelect from "../components/agendamento/ProfissionalSelect";
import DateTimePicker from "../components/agendamento/DateTimePicker";
import ConfirmacaoSection from "../components/agendamento/ConfirmacaoSection";
import ClienteModal from "../components/clientes/ClienteModal";

export default function NovoAgendamento() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const currentUser = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
  const empresaId = currentUser.empresa_id;

  const clienteIdFromUrl = searchParams.get('clienteId');
  const funcionarioIdFromUrl = searchParams.get('funcionarioId');

  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedServico, setSelectedServico] = useState(null);
  const [duracao, setDuracao] = useState(null);
  const [preco, setPreco] = useState(null);
  const [selectedProfissional, setSelectedProfissional] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [showClienteModal, setShowClienteModal] = useState(false);
  
  const [formData, setFormData] = useState({
    observacoes: "",
    enviar_whatsapp: true,
    sincronizar_google: true,
  });

  const { data: clientesDataRaw = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => livegenda.entities.Cliente.list(),
    enabled: !!clienteIdFromUrl,
  });
  const clientesData = Array.isArray(clientesDataRaw) 
    ? clientesDataRaw.filter(c => c.empresa_id === empresaId) 
    : [];

  const { data: funcionariosDataRaw = [] } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: () => livegenda.entities.Funcionario.list(),
    enabled: !!funcionarioIdFromUrl,
  });
  const funcionariosData = Array.isArray(funcionariosDataRaw) 
    ? funcionariosDataRaw.filter(f => f.empresa_id === empresaId) 
    : [];

  useEffect(() => {
    if (clienteIdFromUrl && clientesData.length > 0) {
      const cliente = clientesData.find(c => c.id === clienteIdFromUrl);
      if (cliente && !selectedCliente) {
        setSelectedCliente(cliente);
      }
    }
  }, [clienteIdFromUrl, clientesData, selectedCliente]);

  useEffect(() => {
    if (funcionarioIdFromUrl && funcionariosData.length > 0) {
      const funcionario = funcionariosData.find(f => f.id === funcionarioIdFromUrl);
      if (funcionario && !selectedProfissional) {
        setSelectedProfissional(funcionario);
      }
    }
  }, [funcionarioIdFromUrl, funcionariosData, selectedProfissional]);

  const createClienteMutation = useMutation({
    mutationFn: (data) => livegenda.entities.Cliente.create(data),
    onSuccess: (newCliente) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setSelectedCliente(newCliente);
      setShowClienteModal(false);
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

  const createAgendamentoMutation = useMutation({
    mutationFn: (data) => livegenda.entities.Agendamento.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      toast({
        title: "Agendamento confirmado",
        description: "O agendamento foi criado com sucesso.",
      });
      navigate("/agendamentos");
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar agendamento",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedCliente) {
      toast({ title: "Selecione um cliente", variant: "destructive" });
      return;
    }
    if (!selectedServico) {
      toast({ title: "Selecione um serviço", variant: "destructive" });
      return;
    }
    if (!duracao || !preco) {
      toast({ title: "Serviço sem duração ou preço", variant: "destructive" });
      return;
    }
    if (!selectedProfissional) {
      toast({ title: "Selecione um profissional", variant: "destructive" });
      return;
    }
    if (!selectedDate || !selectedTime) {
      toast({ title: "Selecione data e horário", variant: "destructive" });
      return;
    }

    const dateStr = selectedDate.toISOString().split('T')[0];
    const dataHora = new Date(`${dateStr}T${selectedTime}:00`).toISOString();
    const dataHoraFim = new Date(new Date(`${dateStr}T${selectedTime}:00`).getTime() + (duracao * 60000)).toISOString();

    const agendamentoData = {
      empresa_id: empresaId,
      cliente_id: selectedCliente.id,
      servico_id: selectedServico.id,
      funcionario_id: selectedProfissional.id,
      data_hora: dataHora,
      data_hora_fim: dataHoraFim,
      preco_final: preco,
      observacoes: formData.observacoes,
      status: "pendente",
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
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
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
            onClick={() => navigate("/agendamentos")}
            className="border-gray-300 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={createAgendamentoMutation.isPending}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30"
          >
            {createAgendamentoMutation.isPending ? "Salvando..." : "Confirmar Agendamento"}
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
