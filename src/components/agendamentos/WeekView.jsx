import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import AgendamentoCard from "./AgendamentoCard";

const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const HORARIOS = Array.from({ length: 14 }, (_, i) => i + 9); // 9h às 22h
const SLOT_HEIGHT = 80; // Altura de cada slot de hora em pixels

// Mapeamento de índice de dia para abreviação
const DIAS_ABREVIADOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const DIAS_NOMES = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export default function WeekView({
  currentDate,
  agendamentos,
  clientes,
  servicos,
  funcionarios,
  onAgendamentoClick,
  onDoubleClickSlot,
  isLoading,
  selectedFuncionarioId,
  empresa
}) {
  const getWeekDays = () => {
    const days = [];
    let curr;
    if (typeof currentDate === 'string') {
      const [year, month, day] = currentDate.split('-').map(Number);
      curr = new Date(year, month - 1, day);
    } else {
      curr = new Date(currentDate);
    }
    
    const dayOfWeek = curr.getDay();
    const firstDayOfWeek = new Date(curr);
    firstDayOfWeek.setDate(curr.getDate() - dayOfWeek);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(firstDayOfWeek);
      day.setDate(firstDayOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const allWeekDays = getWeekDays();

  // Verificar se o estabelecimento está aberto em um dia específico
  const isEstabelecimentoFechado = (date) => {
    const dayIndex = date.getDay();
    const diaAbrev = DIAS_ABREVIADOS[dayIndex];
    const diaNome = DIAS_NOMES[dayIndex];
    
    // Verificar dias_funcionamento (array de abreviações)
    if (empresa?.dias_funcionamento && Array.isArray(empresa.dias_funcionamento)) {
      return !empresa.dias_funcionamento.includes(diaAbrev);
    }
    
    // Fallback: verificar horario_funcionamento estruturado
    if (empresa?.horario_funcionamento && typeof empresa.horario_funcionamento === 'object') {
      return empresa.horario_funcionamento[diaNome]?.ativo === false;
    }
    
    // Default: assumir dias úteis abertos (seg-sex)
    return dayIndex === 0 || dayIndex === 6;
  };

  const weekDays = allWeekDays.filter(day => !isEstabelecimentoFechado(day));

  const getAgendamentosForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return agendamentos.filter(agendamento => {
      const matchDate = agendamento.data === dateString;
      const matchFuncionario = !selectedFuncionarioId || agendamento.funcionario_id === selectedFuncionarioId;
      return matchDate && matchFuncionario;
    }).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  };

  // Retorna agendamentos que OCUPAM essa hora (iniciam nela OU cruzam ela)
  const getAgendamentosForDateAndHour = (date, hour) => {
    const dateString = date.toISOString().split('T')[0];
    return agendamentos.filter(agendamento => {
      if (agendamento.data !== dateString) return false;
      if (selectedFuncionarioId && agendamento.funcionario_id !== selectedFuncionarioId) return false;
      
      const [startHour, startMin] = agendamento.hora_inicio.split(':').map(Number);
      const startTotalMinutes = startHour * 60 + startMin;
      const endTotalMinutes = startTotalMinutes + (agendamento.duracao_minutos || 30);
      
      const slotStartMinutes = hour * 60;
      const slotEndMinutes = (hour + 1) * 60;
      
      // Agendamento ocupa este slot se: inicia antes do fim do slot E termina depois do início do slot
      return startTotalMinutes < slotEndMinutes && endTotalMinutes > slotStartMinutes;
    });
  };

  // Calcula posição e altura do agendamento dentro do slot
  const getAgendamentoPosition = (agendamento, slotHour) => {
    const [startHour, startMin] = agendamento.hora_inicio.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMin;
    const endTotalMinutes = startTotalMinutes + (agendamento.duracao_minutos || 30);
    
    const slotStartMinutes = slotHour * 60;
    const slotEndMinutes = (slotHour + 1) * 60;
    
    // Calcular onde o agendamento começa dentro deste slot
    const visibleStartMinutes = Math.max(startTotalMinutes, slotStartMinutes);
    const visibleEndMinutes = Math.min(endTotalMinutes, slotEndMinutes);
    
    // Offset do topo (em porcentagem do slot)
    const topOffset = ((visibleStartMinutes - slotStartMinutes) / 60) * 100;
    
    // Altura (em porcentagem do slot)
    const heightPercent = ((visibleEndMinutes - visibleStartMinutes) / 60) * 100;
    
    // Se é a primeira hora do agendamento
    const isFirstSlot = startHour === slotHour;
    
    // Se é a última hora do agendamento
    const isLastSlot = endTotalMinutes <= slotEndMinutes;
    
    return {
      topPercent: topOffset,
      heightPercent: heightPercent,
      isFirstSlot,
      isLastSlot
    };
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-purple-100 p-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {weekDays.map((day, idx) => {
          const dayAgendamentos = getAgendamentosForDate(day);
          return (
            <div
              key={idx}
              className={`bg-white rounded-xl border overflow-hidden ${
                isToday(day) ? 'border-purple-300 shadow-lg' : 'border-purple-100'
              }`}
            >
              <div className={`p-3 ${isToday(day) ? 'bg-purple-50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-600">
                    {DIAS_SEMANA[day.getDay()]}
                  </span>
                  <span className={`text-lg font-bold ${isToday(day) ? 'text-purple-700' : 'text-gray-700'}`}>
                    {day.getDate()}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-purple-50">
                {dayAgendamentos.length > 0 ? (
                  dayAgendamentos.map((agendamento) => {
                    const cliente = clientes.find(c => c.id === agendamento.cliente_id);
                    const servico = servicos.find(s => s.id === agendamento.servico_id);
                    const funcionario = funcionarios.find(f => f.id === agendamento.funcionario_id);
                    return (
                      <div key={agendamento.id} className="p-2">
                        <AgendamentoCard
                          agendamento={agendamento}
                          cliente={cliente}
                          servico={servico}
                          funcionario={funcionario}
                          onClick={() => onAgendamentoClick(agendamento)}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    Sem agendamentos
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-xl border border-purple-100 overflow-hidden">
        {/* Cabeçalho */}
        <div 
          className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100"
          style={{ 
            display: 'grid',
            gridTemplateColumns: `60px repeat(${weekDays.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="p-3"></div>
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              className={`p-3 text-center border-l border-purple-100 ${
                isToday(day) ? 'bg-purple-100' : ''
              }`}
            >
              <div className="text-xs font-semibold text-purple-600">
                {DIAS_SEMANA[day.getDay()]}
              </div>
              <div className={`text-xl font-bold ${isToday(day) ? 'text-purple-700' : 'text-gray-700'}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Grade de horários */}
        <div className="overflow-auto">
          {HORARIOS.map((hora) => (
            <div
              key={hora}
              className="border-b border-purple-50 hover:bg-purple-50/30 transition-colors"
              style={{ 
                height: `${SLOT_HEIGHT}px`,
                display: 'grid',
                gridTemplateColumns: `60px repeat(${weekDays.length}, minmax(0, 1fr))`,
              }}
            >
              {/* Coluna de horário */}
              <div className="p-2 lg:p-3 text-xs text-gray-500 font-medium">
                {hora}:00
              </div>

              {/* Colunas dos dias */}
              {weekDays.map((day, dayIdx) => {
                const dayAgendamentos = getAgendamentosForDateAndHour(day, hora);
                return (
                  <div
                    key={dayIdx}
                    className="border-l border-purple-100 relative"
                    style={{ height: `${SLOT_HEIGHT}px` }}
                    onDoubleClick={() => onDoubleClickSlot && onDoubleClickSlot(day, `${hora}:00`)}
                  >
                    {dayAgendamentos.map((agendamento) => {
                      const cliente = clientes.find(c => c.id === agendamento.cliente_id);
                      const servico = servicos.find(s => s.id === agendamento.servico_id);
                      const funcionario = funcionarios.find(f => f.id === agendamento.funcionario_id);
                      const position = getAgendamentoPosition(agendamento, hora);

                      return (
                        <div
                          key={`${agendamento.id}-${hora}`}
                          className="absolute left-1 right-1"
                          style={{
                            top: `${position.topPercent}%`,
                            height: `${position.heightPercent}%`,
                            minHeight: '20px',
                            zIndex: 10
                          }}
                        >
                          <AgendamentoCard
                            agendamento={agendamento}
                            cliente={cliente}
                            servico={servico}
                            funcionario={funcionario}
                            onClick={() => onAgendamentoClick(agendamento)}
                            compact={!position.isFirstSlot}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
