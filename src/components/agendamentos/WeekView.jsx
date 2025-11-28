import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import AgendamentoCard from "./AgendamentoCard";

const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const HORARIOS = Array.from({ length: 14 }, (_, i) => i + 9); // 9h às 22h

export default function WeekView({
  currentDate,
  agendamentos,
  clientes,
  servicos,
  funcionarios,
  onAgendamentoClick,
  onDoubleClickSlot,
  isLoading,
  selectedFuncionarioId
}) {
  const getWeekDays = () => {
    const days = [];
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay();
    
    // Calcular o primeiro dia da semana (domingo)
    const firstDayOfWeek = new Date(curr);
    firstDayOfWeek.setDate(curr.getDate() - dayOfWeek);
    
    // Gerar os 7 dias da semana
    for (let i = 0; i < 7; i++) {
      const day = new Date(firstDayOfWeek);
      day.setDate(firstDayOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const allWeekDays = getWeekDays();

  // Buscar configuração de horário de funcionamento
  const { data: configuracoes = [] } = useQuery({
    queryKey: ['configuracoes'],
    queryFn: () => base44.entities.ConfiguracaoNegocio.list(),
    initialData: [],
  });

  const configuracao = configuracoes[0];

  // Mapear dia da semana para chave do horário
  const getDiaChave = (dayIndex) => {
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    return dias[dayIndex];
  };

  // Verificar se o estabelecimento está aberto em um dia específico
  const isEstabelecimentoFechado = (date) => {
    if (!configuracao?.horario_funcionamento) return false;
    const diaChave = getDiaChave(date.getDay());
    return configuracao.horario_funcionamento[diaChave]?.ativo === false;
  };

  // Filtrar apenas dias abertos
  const weekDays = allWeekDays.filter(day => !isEstabelecimentoFechado(day));

  const getAgendamentosForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return agendamentos.filter(agendamento => {
      const matchDate = agendamento.data === dateString;
      const matchFuncionario = !selectedFuncionarioId || agendamento.funcionario_id === selectedFuncionarioId;
      return matchDate && matchFuncionario;
    }).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  };

  const getAgendamentosForDateAndHour = (date, hour) => {
    const dateString = date.toISOString().split('T')[0];
    return agendamentos.filter(agendamento => {
      if (agendamento.data !== dateString) return false;
      const agendHour = parseInt(agendamento.hora_inicio.split(':')[0]);
      const matchHour = agendHour === hour;
      const matchFuncionario = !selectedFuncionarioId || agendamento.funcionario_id === selectedFuncionarioId;
      return matchHour && matchFuncionario;
    });
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

  // Mobile View - Cards por dia
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
                  <div>
                    <div className="text-xs text-gray-500 font-medium mb-0.5">
                      {DIAS_SEMANA[day.getDay()]}
                    </div>
                    <div className={`text-lg font-semibold ${
                      isToday(day) ? 'text-purple-600' : 'text-gray-900'
                    }`}>
                      {day.getDate()}/{String(day.getMonth() + 1).padStart(2, '0')}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {dayAgendamentos.length} agendamento{dayAgendamentos.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              
              {dayAgendamentos.length > 0 ? (
                <div className="p-3 space-y-2">
                  {dayAgendamentos.map((agendamento) => {
                    const cliente = clientes.find(c => c.id === agendamento.cliente_id);
                    const servico = servicos.find(s => s.id === agendamento.servico_id);
                    const funcionario = funcionarios.find(f => f.id === agendamento.funcionario_id);

                    return (
                      <AgendamentoCard
                        key={agendamento.id}
                        agendamento={agendamento}
                        cliente={cliente}
                        servico={servico}
                        funcionario={funcionario}
                        onClick={() => onAgendamentoClick(agendamento)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400 text-xs">
                  Nenhum agendamento
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop/Tablet View - Grade */}
      <div className="hidden md:block bg-white rounded-xl border border-purple-100 overflow-hidden">
        {/* Header com dias da semana */}
        <div 
          className="border-b border-purple-100"
          style={{
            display: 'grid',
            gridTemplateColumns: `60px repeat(${weekDays.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="p-2 lg:p-4 text-xs text-gray-500 font-medium">
            GMT-03
          </div>
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              className={`p-2 lg:p-4 text-center border-l border-purple-100 ${
                isToday(day) ? 'bg-purple-50' : ''
              }`}
            >
              <div className="text-xs text-gray-500 font-medium mb-1">
                {DIAS_SEMANA[day.getDay()]}
              </div>
              <div className={`text-lg lg:text-2xl font-semibold ${
                isToday(day) ? 'text-purple-600' : 'text-gray-900'
              }`}>
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
                minHeight: '80px',
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
                    className="border-l border-purple-100 p-1 lg:p-2 relative overflow-hidden"
                    onDoubleClick={() => onDoubleClickSlot(day, `${hora}:00`)}
                  >
                    {dayAgendamentos.map((agendamento) => {
                      const cliente = clientes.find(c => c.id === agendamento.cliente_id);
                      const servico = servicos.find(s => s.id === agendamento.servico_id);
                      const funcionario = funcionarios.find(f => f.id === agendamento.funcionario_id);

                      return (
                        <AgendamentoCard
                          key={agendamento.id}
                          agendamento={agendamento}
                          cliente={cliente}
                          servico={servico}
                          funcionario={funcionario}
                          onClick={() => onAgendamentoClick(agendamento)}
                        />
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