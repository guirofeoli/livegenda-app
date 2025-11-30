import React, { useState } from "react";
import { livegenda } from "@/api/livegendaClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Filter, Calendar as CalendarIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import WeekView from "../components/agendamentos/WeekView";
import DayView from "../components/agendamentos/DayView";
import WeekByFuncionarioView from "../components/agendamentos/WeekByFuncionarioView";
import AgendamentoDetailModal from "../components/agendamentos/AgendamentoDetailModal";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Agendamentos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("weekByFuncionario");
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState(null);
  
  // Obter empresa e funcionário do usuário logado
  const currentUser = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
  const empresaId = currentUser.empresa_id;
  const isFuncionario = currentUser.tipo === 'funcionario';
  const funcionarioId = currentUser.funcionario_id;

  const { data: agendamentosData = [], isLoading } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => livegenda.entities.Agendamento.list("-created_date"),
    initialData: [],
  });
  
  // Filtrar agendamentos por empresa e por funcionário se for funcionário
  const agendamentos = Array.isArray(agendamentosData) 
    ? agendamentosData.filter(a => {
        if (a.empresa_id !== empresaId) return false;
        if (isFuncionario && a.funcionario_id !== funcionarioId) return false;
        return true;
      })
    : [];

  const { data: clientesDataData = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => livegenda.entities.Cliente.list(),
    initialData: [],
  });
  const clientesData = Array.isArray(clientesDataData) ? clientesDataData : [];
  const clientes = Array.isArray(clientesData) ? clientesData : [];

  const { data: servicosDataData = [] } = useQuery({
    queryKey: ['servicos'],
    queryFn: () => livegenda.entities.Servico.list(),
    initialData: [],
  });
  const servicosData = Array.isArray(servicosDataData) ? servicosDataData : [];
  const servicos = Array.isArray(servicosData) ? servicosData : [];

  const { data: funcionariosDataData = [] } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: () => livegenda.entities.Funcionario.list(),
    initialData: [],
  });
  const funcionariosData = Array.isArray(funcionariosDataData) ? funcionariosDataData : [];
  const funcionarios = Array.isArray(funcionariosData) ? funcionariosData : [];

  const updateAgendamentoMutation = useMutation({
    mutationFn: ({ id, data }) => livegenda.entities.Agendamento.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      const statusMessages = {
        "Confirmado": "Agendamento confirmado com sucesso",
        "Cancelado": "Agendamento cancelado com sucesso"
      };
      setSelectedAgendamento(null);
    },
    onError: () => {
    }
  });

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week" || viewMode === "weekByFuncionario") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week" || viewMode === "weekByFuncionario") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleAgendamentoClick = (agendamento) => {
    setSelectedAgendamento(agendamento);
  };

  const handleCloseModal = () => {
    setSelectedAgendamento(null);
  };

  const handleEditAgendamento = (editedData) => {
    if (selectedAgendamento) {
      updateAgendamentoMutation.mutate({ 
        id: selectedAgendamento.id, 
        data: editedData
      });
    }
  };

  const handleConfirmAgendamento = () => {
    if (selectedAgendamento) {
      updateAgendamentoMutation.mutate({ 
        id: selectedAgendamento.id, 
        data: { status: "Confirmado" }
      });
    }
  };

  const handleCancelAgendamento = () => {
    if (selectedAgendamento) {
      updateAgendamentoMutation.mutate({ 
        id: selectedAgendamento.id, 
        data: { status: "Cancelado" }
      });
    }
  };

  const handleDoubleClickSlot = (date, time) => {
    navigate(createPageUrl("NovoAgendamento"));
  };

  const handleDateSelect = (date) => {
    if (date) {
      setCurrentDate(date);
    }
  };

  return (
    <div className="p-3 md:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 md:mb-6"
      >
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={goToToday}
                className="border-purple-200 hover:bg-purple-50 hover:text-purple-700 flex-shrink-0 text-xs md:text-sm px-3 h-9"
              >
                Hoje
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-purple-200 hover:bg-purple-50 hover:text-purple-700 flex-shrink-0 gap-1 md:gap-2 text-xs md:text-sm px-3 h-9"
                  >
                    <CalendarIcon className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Ir para data</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  className="hover:bg-purple-50 flex-shrink-0 h-9 w-9"
                >
                  <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  className="hover:bg-purple-50 flex-shrink-0 h-9 w-9"
                >
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                </Button>
              </div>

              <h1 className="text-base md:text-xl lg:text-2xl font-bold text-gray-900 whitespace-nowrap">
                {MESES[currentDate.getMonth()]} de {currentDate.getFullYear()}
              </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <div className="flex items-center gap-1 border border-purple-200 rounded-lg p-0.5">
                <Button
                  variant={viewMode === "weekByFuncionario" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("weekByFuncionario")}
                  className={`text-xs px-2 md:px-3 h-8 ${viewMode === "weekByFuncionario" ? "bg-purple-600 hover:bg-purple-700" : "hover:bg-purple-50"}`}
                >
                  <span className="hidden lg:inline">Semana por Funcionários</span>
                  <span className="lg:hidden">Funcionários</span>
                </Button>
                <Button
                  variant={viewMode === "day" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("day")}
                  className={`text-xs px-2 md:px-3 h-8 ${viewMode === "day" ? "bg-purple-600 hover:bg-purple-700" : "hover:bg-purple-50"}`}
                >
                  Dia
                </Button>
                <Button
                  variant={viewMode === "week" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("week")}
                  className={`text-xs px-2 md:px-3 h-8 ${viewMode === "week" ? "bg-purple-600 hover:bg-purple-700" : "hover:bg-purple-50"}`}
                >
                  Semana
                </Button>
              </div>

              <Button
                onClick={() => navigate(createPageUrl("NovoAgendamento"))}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30 text-xs md:text-sm px-3 h-9"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Novo Agendamento</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Filter className="w-3 h-3 md:w-4 md:h-4 text-gray-500 flex-shrink-0" />
            <Select
              value={selectedFuncionarioId || "all"}
              onValueChange={(value) => setSelectedFuncionarioId(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-full md:w-64 border-purple-200 focus:border-purple-500 focus:ring-purple-500 text-xs md:text-sm h-9">
                <SelectValue placeholder="Filtrar por profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os profissionais</SelectItem>
                {funcionarios.map((funcionario) => (
                  <SelectItem key={funcionario.id} value={funcionario.id}>
                    {funcionario.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {viewMode === "weekByFuncionario" ? (
          <WeekByFuncionarioView
            currentDate={currentDate}
            agendamentos={agendamentos}
            clientes={clientes}
            servicos={servicos}
            funcionarios={funcionarios}
            onAgendamentoClick={handleAgendamentoClick}
            onDoubleClickSlot={handleDoubleClickSlot}
            isLoading={isLoading}
            selectedFuncionarioId={selectedFuncionarioId}
          />
        ) : viewMode === "day" ? (
          <DayView
            currentDate={currentDate}
            agendamentos={agendamentos}
            clientes={clientes}
            servicos={servicos}
            funcionarios={funcionarios}
            onAgendamentoClick={handleAgendamentoClick}
            onDoubleClickSlot={handleDoubleClickSlot}
            isLoading={isLoading}
            selectedFuncionarioId={selectedFuncionarioId}
          />
        ) : (
          <WeekView
            currentDate={currentDate}
            agendamentos={agendamentos}
            clientes={clientes}
            servicos={servicos}
            funcionarios={funcionarios}
            onAgendamentoClick={handleAgendamentoClick}
            onDoubleClickSlot={handleDoubleClickSlot}
            isLoading={isLoading}
            selectedFuncionarioId={selectedFuncionarioId}
            />
            )}
      </motion.div>

      <AnimatePresence>
        {selectedAgendamento && (
          <AgendamentoDetailModal
            agendamento={selectedAgendamento}
            cliente={clientes.find(c => c.id === selectedAgendamento.cliente_id)}
            servico={servicos.find(s => s.id === selectedAgendamento.servico_id)}
            servicos={servicos}
            funcionario={funcionarios.find(f => f.id === selectedAgendamento.funcionario_id)}
            funcionarios={funcionarios}
            onClose={handleCloseModal}
            onEdit={handleEditAgendamento}
            onConfirm={handleConfirmAgendamento}
            onCancel={handleCancelAgendamento}
            isLoading={updateAgendamentoMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
