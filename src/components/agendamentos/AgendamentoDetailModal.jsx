
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
  Agendado: "bg-blue-100 text-blue-800",
  Confirmado: "bg-green-100 text-green-800",
  Cancelado: "bg-red-100 text-red-800",
  Concluído: "bg-purple-100 text-purple-800",
};

export default function AgendamentoDetailModal({
  agendamento,
  cliente,
  servico,
  servicos = [],
  funcionario,
  funcionarios = [],
  onClose,
  onEdit,
  onConfirm,
  onCancel,
  isLoading
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});

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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onEdit(editedData);
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
    <Dialog open={true} onOpenChange={onClose}>
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
            <Badge className={`${STATUS_COLORS[agendamento.status]} pointer-events-none`}>
              {agendamento.status}
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
                      <label className="text-xs text-gray-500 mb-1 block">Duração (min)</label>
                      <Input
                        type="number"
                        value={editedData.duracao_minutos}
                        onChange={(e) => setEditedData({ ...editedData, duracao_minutos: Number(e.target.value) })}
                        className="h-9 border-purple-200 focus:border-purple-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Preço (R$)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editedData.preco}
                        onChange={(e) => setEditedData({ ...editedData, preco: Number(e.target.value) })}
                        className="h-9 border-purple-200 focus:border-purple-500"
                        min="0"
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
                    {duracaoMinutos} minutos • R$ {agendamento.preco?.toFixed(2)}
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
              <p className="text-sm text-gray-500 mb-1">Profissional</p>
              {isEditing ? (
                <Select
                  value={editedData.funcionario_id}
                  onValueChange={(value) => setEditedData({ ...editedData, funcionario_id: value })}
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

          {/* Data e Hora - EDITÁVEL */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm text-gray-500">Data e Horário</p>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    type="date"
                    value={editedData.data}
                    onChange={(e) => setEditedData({ ...editedData, data: e.target.value })}
                    className="h-9 border-purple-200 focus:border-purple-500"
                  />
                  <Input
                    type="time"
                    value={editedData.hora_inicio}
                    onChange={(e) => setEditedData({ ...editedData, hora_inicio: e.target.value })}
                    className="h-9 border-purple-200 focus:border-purple-500"
                  />
                </div>
              ) : (
                <>
                  <p className="font-semibold text-gray-900 capitalize">
                    {formatDate(agendamento.data)}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{agendamento.hora_inicio} - {horaFim}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Observações - EDITÁVEL */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Observações</p>
              {isEditing ? (
                <Textarea
                  value={editedData.observacoes}
                  onChange={(e) => setEditedData({ ...editedData, observacoes: e.target.value })}
                  placeholder="Adicione observações..."
                  className="min-h-[80px] border-purple-200 focus:border-purple-500 resize-none"
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
                onClick={onClose}
                disabled={isLoading}
                className="border-gray-300 hover:bg-gray-50"
              >
                Fechar
              </Button>
              
              {agendamento.status !== "Cancelado" && agendamento.status !== "Concluído" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      disabled={isLoading}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          Ações
                          <MoreVertical className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Agendamento
                    </DropdownMenuItem>
                    
                    {agendamento.status === "Agendado" && (
                      <DropdownMenuItem onClick={onConfirm} className="text-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirmar Agendamento
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={onCancel} className="text-red-600">
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancelar Agendamento
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
