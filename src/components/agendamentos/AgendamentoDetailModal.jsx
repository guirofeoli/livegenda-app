import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Calendar, Clock, User, Scissors, FileText, Loader2, MoreVertical, CheckCircle, Edit, XCircle, Save, X } from "lucide-react";

const STATUS_COLORS = {
  pendente: "bg-blue-100 text-blue-800",
  agendado: "bg-blue-100 text-blue-800",
  confirmado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

const STATUS_LABELS = {
  pendente: "Pendente",
  agendado: "Agendado",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
};

// Mapeamento de índice de dia para abreviação
const DIAS_ABREVIADOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const DIAS_NOMES = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export default function AgendamentoDetailModal({
  agendamento,
  cliente,
  servico,
  servicos = [],
  funcionario,
  funcionarios = [],
  empresa,
  onClose,
  onEdit,
  onConfirm,
  onCancel,
  isLoading
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [isOpen, setIsOpen] = useState(true);
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    if (agendamento) {
      setEditedData({
        servico_id: agendamento.servico_id,
        funcionario_id: agendamento.funcionario_id,
        data: agendamento.data,
        hora_inicio: agendamento.hora_inicio,
        duracao_minutos: agendamento.duracao_minutos,
        preco: agendamento.preco,
        observacoes: agendamento.observacoes || "",
      });
      setIsOpen(true);
    }
  }, [agendamento]);

  const calcularHoraFim = (horaInicio, duracaoMinutos) => {
    if (!horaInicio || !duracaoMinutos) return "";
    
    const [hora, minuto] = horaInicio.split(':').map(Number);
    const totalMinutos = hora * 60 + minuto + duracaoMinutos;
    const horaFim = Math.floor(totalMinutos / 60);
    const minutoFim = totalMinutos % 60;
    
    return `${String(horaFim).padStart(2, '0')}:${String(minutoFim).padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Verificar se uma data é um dia de funcionamento da empresa
  const isDataPermitida = (dateString) => {
    if (!dateString) return true;
    
    const date = new Date(dateString + 'T00:00:00');
    const dayIndex = date.getDay();
    const diaAbrev = DIAS_ABREVIADOS[dayIndex];
    const diaNome = DIAS_NOMES[dayIndex];
    
    // Verificar dias_funcionamento (array de abreviações)
    if (empresa?.dias_funcionamento && Array.isArray(empresa.dias_funcionamento)) {
      return empresa.dias_funcionamento.includes(diaAbrev);
    }
    
    // Fallback: verificar horario_funcionamento estruturado
    if (empresa?.horario_funcionamento && typeof empresa.horario_funcionamento === 'object') {
      return empresa.horario_funcionamento[diaNome]?.ativo !== false;
    }
    
    // Default: assumir dias úteis abertos (seg-sex)
    return dayIndex >= 1 && dayIndex <= 5;
  };

  // Handler para mudança de data com validação
  const handleDataChange = (newDate) => {
    if (!isDataPermitida(newDate)) {
      setDataError('Estabelecimento não funciona neste dia');
    } else {
      setDataError('');
    }
    setEditedData({...editedData, data: newDate});
  };

  const handleEdit = () => {
    setIsEditing(true);
    setDataError('');
  };

  const handleSave = () => {
    // Validar data antes de salvar
    if (!isDataPermitida(editedData.data)) {
      setDataError('Estabelecimento não funciona neste dia');
      return;
    }
    // Construir data_hora e data_hora_fim no formato ISO para o backend
    const dataToSend = { ...editedData };
    
    if (editedData.data && editedData.hora_inicio) {
      // Criar data_hora como ISO string
      dataToSend.data_hora = `${editedData.data}T${editedData.hora_inicio}:00`;
      
      // Calcular hora_fim e criar data_hora_fim
      const horaFimStr = calcularHoraFim(editedData.hora_inicio, editedData.duracao_minutos);
      if (horaFimStr) {
        dataToSend.data_hora_fim = `${editedData.data}T${horaFimStr}:00`;
      }
    }
    
    onEdit(dataToSend);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedData({
      servico_id: agendamento.servico_id,
      funcionario_id: agendamento.funcionario_id,
      data: agendamento.data,
      hora_inicio: agendamento.hora_inicio,
      duracao_minutos: agendamento.duracao_minutos,
      preco: agendamento.preco,
      observacoes: agendamento.observacoes || "",
    });
    setIsEditing(false);
  };

  const handleServicoChange = (servicoId) => {
    const selectedServico = servicos.find(s => s.id === servicoId);
    setEditedData({
      ...editedData,
      servico_id: servicoId,
      duracao_minutos: selectedServico?.duracao_minutos || editedData.duracao_minutos,
      preco: selectedServico?.preco || editedData.preco,
    });
  };

  const handleOpenChange = (open) => {
    if (!open) {
      setIsOpen(false);
      setTimeout(() => {
        onClose();
      }, 150);
    }
  };

  const handleConfirmClick = () => {
    setIsOpen(false);
    setTimeout(() => {
      onConfirm();
    }, 150);
  };

  const handleCancelClick = () => {
    setIsOpen(false);
    setTimeout(() => {
      onCancel();
    }, 150);
  };

  const currentServico = isEditing 
    ? servicos.find(s => s.id === editedData.servico_id)
    : servico;

  const currentFuncionario = isEditing
    ? funcionarios.find(f => f.id === editedData.funcionario_id)
    : funcionario;

  const duracaoMinutos = isEditing ? editedData.duracao_minutos : agendamento.duracao_minutos;
  const horaFim = calcularHoraFim(
    isEditing ? editedData.hora_inicio : agendamento.hora_inicio,
    duracaoMinutos
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isEditing ? "Editando Agendamento" : "Detalhes do Agendamento"}
              {isEditing && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 bg-purple-500 rounded-full"
                />
              )}
            </div>
            <Badge className={`${STATUS_COLORS[agendamento.status] || STATUS_COLORS.pendente} pointer-events-none`}>
              {STATUS_LABELS[agendamento.status] || agendamento.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 py-4"
        >
          {/* Cliente - NÃO EDITÁVEL */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Cliente</p>
              <p className="font-semibold text-gray-900">
                {cliente?.nome_completo || "Não informado"}
              </p>
              <p className="text-sm text-gray-600">{cliente?.telefone}</p>
            </div>
          </div>

          {/* Serviço - EDITÁVEL COM DURAÇÃO E PREÇO */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Scissors className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm text-gray-500">Serviço</p>
              {isEditing ? (
                <>
                  <Select
                    value={editedData.servico_id}
                    onValueChange={handleServicoChange}
                  >
                    <SelectTrigger className="h-9 border-purple-200 focus:border-purple-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {servicos.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Duração (min)</p>
                      <Input
                        type="number"
                        value={editedData.duracao_minutos}
                        onChange={(e) => setEditedData({...editedData, duracao_minutos: parseInt(e.target.value) || 0})}
                        className="h-9 border-purple-200 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Preço (R$)</p>
                      <Input
                        type="number"
                        step="0.01"
                        value={editedData.preco}
                        onChange={(e) => setEditedData({...editedData, preco: parseFloat(e.target.value) || 0})}
                        className="h-9 border-purple-200 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold text-gray-900">
                    {currentServico?.nome || "Não informado"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {duracaoMinutos} min • R$ {agendamento.preco?.toFixed(2)}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Profissional - EDITÁVEL */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Profissional</p>
              {isEditing ? (
                <Select
                  value={editedData.funcionario_id}
                  onValueChange={(value) => setEditedData({...editedData, funcionario_id: value})}
                >
                  <SelectTrigger className="h-9 border-purple-200 focus:border-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="font-semibold text-gray-900">
                  {currentFuncionario?.nome_completo || "Não informado"}
                </p>
              )}
            </div>
          </div>

          {/* Data e Hora - EDITÁVEIS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Data</p>
                {isEditing ? (
                  <div className="space-y-1">
                    <Input
                      type="date"
                      value={editedData.data}
                      onChange={(e) => handleDataChange(e.target.value)}
                      className={`h-9 border-purple-200 focus:border-purple-500 ${dataError ? 'border-red-500' : ''}`}
                      data-testid="input-data-agendamento"
                    />
                    {dataError && (
                      <p className="text-xs text-red-500">{dataError}</p>
                    )}
                  </div>
                ) : (
                  <p className="font-semibold text-gray-900 text-sm">
                    {formatDate(agendamento.data)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Horário</p>
                {isEditing ? (
                  <Input
                    type="time"
                    value={editedData.hora_inicio}
                    onChange={(e) => setEditedData({...editedData, hora_inicio: e.target.value})}
                    className="h-9 border-purple-200 focus:border-purple-500"
                  />
                ) : (
                  <p className="font-semibold text-gray-900">
                    {agendamento.hora_inicio} - {horaFim}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Observações - EDITÁVEIS */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Observações</p>
              {isEditing ? (
                <Textarea
                  value={editedData.observacoes}
                  onChange={(e) => setEditedData({...editedData, observacoes: e.target.value})}
                  className="min-h-[80px] border-purple-200 focus:border-purple-500"
                  placeholder="Adicione observações..."
                />
              ) : (
                <p className="text-gray-900">
                  {agendamento.observacoes || "Nenhuma observação"}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        <DialogFooter className="gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isLoading}
                className="border-gray-300 hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
                className="border-gray-300 hover:bg-gray-50"
                data-testid="button-close-modal"
              >
                Fechar
              </Button>
              
              {agendamento.status !== "cancelado" && (
                <div className="flex gap-2">
                  {/* Botão de Confirmar - Visível para status "agendado" ou "pendente" */}
                  {(agendamento.status === "agendado" || agendamento.status === "pendente") && (
                    <Button
                      onClick={handleConfirmClick}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/30"
                      data-testid="button-confirm-agendamento"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Confirmando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmar
                        </>
                      )}
                    </Button>
                  )}
                  
                  {/* Menu de ações secundárias */}
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={isLoading}
                        className="border-purple-200 hover:bg-purple-50"
                        data-testid="button-actions-dropdown"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleEdit} data-testid="menu-edit">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Agendamento
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem onClick={handleCancelClick} className="text-red-600" data-testid="menu-cancel">
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancelar Agendamento
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
