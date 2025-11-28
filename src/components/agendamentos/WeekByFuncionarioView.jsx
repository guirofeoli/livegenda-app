import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import AgendamentoCard from "./AgendamentoCard";

const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

const COLOR_PALETTE = [
  { bg: "from-purple-400 to-purple-500", border: "border-purple-400", shadow: "shadow-purple-400/30" },
  { bg: "from-indigo-400 to-indigo-500", border: "border-indigo-400", shadow: "shadow-indigo-400/30" },
  { bg: "from-violet-400 to-violet-500", border: "border-violet-400", shadow: "shadow-violet-400/30" },
  { bg: "from-fuchsia-400 to-fuchsia-500", border: "border-fuchsia-400", shadow: "shadow-fuchsia-400/30" },
  { bg: "from-pink-400 to-pink-500", border: "border-pink-400", shadow: "shadow-pink-400/30" },
  { bg: "from-rose-400 to-rose-500", border: "border-rose-400", shadow: "shadow-rose-400/30" },
  { bg: "from-purple-500 to-purple-600", border: "border-purple-500", shadow: "shadow-purple-500/30" },
  { bg: "from-indigo-500 to-indigo-600", border: "border-indigo-500", shadow: "shadow-indigo-500/30" },
  { bg: "from-violet-500 to-violet-600", border: "border-violet-500", shadow: "shadow-violet-500/30" },
  { bg: "from-fuchsia-500 to-fuchsia-600", border: "border-fuchsia-500", shadow: "shadow-fuchsia-500/30" },
];

export default function WeekByFuncionarioView({
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

  const { data: configuracoes = [] } = useQuery({
    queryKey: ['configuracoes'],
    queryFn: () => base44.entities.ConfiguracaoNegocio.list(),
    initialData: [],
  });

  const configuracao = configuracoes[0];

  const getDiaChave = (dayIndex) => {
    const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    return dias[dayIndex];
  };

  const isEstabelecimentoFechado = (date) => {
    if (!configuracao?.horario_funcionamento) return false;
    const diaChave = getDiaChave(date.getDay());
    return configuracao.horario_funcionamento[diaChave]?.ativo === false;
  };

  const weekDays = allWeekDays.filter(day => !isEstabelecimentoFechado(day));

  const getHorariosComAgendamentos = (funcionarioId) => {
    const horariosSet = new Set();
    const dateStrings = weekDays.map(d => d.toISOString().split('T')[0]);
    
    agendamentos.forEach(agendamento => {
      if (agendamento.funcionario_id === funcionarioId && dateStrings.includes(agendamento.data)) {
        const hora = parseInt(agendamento.hora_inicio.split(':')[0]);
        horariosSet.add(hora);
      }
    });
    
    return Array.from(horariosSet).sort((a, b) => a - b);
  };

  const getAgendamentosForSlot = (funcionarioId, date, hour) => {
    const dateString = date.toISOString().split('T')[0];
    return agendamentos.filter(agendamento => {
      if (agendamento.funcionario_id !== funcionarioId) return false;
      if (agendamento.data !== dateString) return false;
      const agendHour = parseInt(agendamento.hora_inicio.split(':')[0]);
      return agendHour === hour;
    });
  };

  const getAgendamentosForFuncionario = (funcionarioId) => {
    const dateStrings = weekDays.map(d => d.toISOString().split('T')[0]);
    return agendamentos.filter(agendamento => {
      return agendamento.funcionario_id === funcionarioId && dateStrings.includes(agendamento.data);
    }).sort((a, b) => {
      if (a.data !== b.data) return a.data.localeCompare(b.data);
      return a.hora_inicio.localeCompare(b.hora_inicio);
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const calcularHoraFim = (agendamento) => {
    if (!agendamento.hora_inicio || !agendamento.duracao_minutos) return "";
    const [hora, minuto] = agendamento.hora_inicio.split(':').map(Number);
    const totalMinutos = hora * 60 + minuto + agendamento.duracao_minutos;
    const horaFim = Math.floor(totalMinutos / 60);
    const minutoFim = totalMinutos % 60;
    return `${String(horaFim).padStart(2, '0')}:${String(minutoFim).padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day}/${String(month).padStart(2, '0')}`;
  };

  const funcionariosFiltrados = selectedFuncionarioId 
    ? funcionarios.filter(f => f.id === selectedFuncionarioId)
    : funcionarios;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-purple-100 p-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <>
      {/* Mobile View - Cards por funcionário */}
      <div className="md:hidden space-y-3">
        {funcionariosFiltrados.map((funcionario, index) => {
          const funcAgendamentos = getAgendamentosForFuncionario(funcionario.id);
          const colors = COLOR_PALETTE[index % COLOR_PALETTE.length];
          
          if (funcAgendamentos.length === 0) {
            return null;
          }

          return (
            <div key={funcionario.id} className="bg-white rounded-xl border border-purple-100 overflow-hidden">
              <div className={`bg-gradient-to-r ${colors.bg} px-4 py-3`}>
                <h3 className="font-semibold text-white">{funcionario.nome}</h3>
              </div>
              <div className="divide-y divide-purple-50">
                {funcAgendamentos.map((agendamento) => {
                  const cliente = clientes.find(c => c.id === agendamento.cliente_id);
                  const servico = servicos.find(s => s.id === agendamento.servico_id);
                  
                  return (
                    <div
                      key={agendamento.id}
                      onClick={() => onAgendamentoClick(agendamento)}
                      className="p-3 hover:bg-purple-50/50 transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs text-purple-600 font-medium">
                          {formatDate(agendamento.data)} • {agendamento.hora_inicio} - {calcularHoraFim(agendamento)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          agendamento.status === 'Confirmado' ? 'bg-green-100 text-green-700' :
                          agendamento.status === 'Cancelado' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {agendamento.status || 'Pendente'}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 text-sm">{cliente?.nome || 'Cliente não encontrado'}</p>
                      <p className="text-xs text-gray-500">{servico?.nome || 'Serviço não encontrado'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {funcionariosFiltrados.every(f => getAgendamentosForFuncionario(f.id).length === 0) && (
          <div className="bg-white rounded-xl border border-purple-100 p-8 text-center">
            <p className="text-gray-500">Nenhum agendamento nesta semana</p>
          </div>
        )}
      </div>

      {/* Desktop View - Tabela por funcionário */}
      <div className="hidden md:block bg-white rounded-xl border border-purple-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <th className="p-3 text-left text-xs font-semibold text-purple-700 uppercase tracking-wider border-b border-purple-100 w-40">
                  Profissional
                </th>
                {weekDays.map((day, index) => (
                  <th
                    key={index}
                    className={`p-3 text-center text-xs font-semibold uppercase tracking-wider border-b border-purple-100 min-w-[120px] ${
                      isToday(day) ? 'bg-purple-100 text-purple-700' : 'text-purple-600'
                    }`}
                  >
                    <div>{DIAS_SEMANA[day.getDay()]}</div>
                    <div className={`text-lg font-bold ${isToday(day) ? 'text-purple-700' : 'text-gray-700'}`}>
                      {day.getDate()}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {funcionariosFiltrados.map((funcionario, funcIndex) => {
                const colors = COLOR_PALETTE[funcIndex % COLOR_PALETTE.length];
                
                return (
                  <tr key={funcionario.id} className="border-b border-purple-50 hover:bg-purple-50/30 transition-colors">
                    <td className="p-3 align-top">
                      <div className={`flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r ${colors.bg} text-white`}>
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                          {funcionario.nome?.charAt(0) || '?'}
                        </div>
                        <span className="font-medium text-sm truncate">{funcionario.nome}</span>
                      </div>
                    </td>
                    {weekDays.map((day, dayIndex) => {
                      const dayAgendamentos = getAgendamentosForFuncionario(funcionario.id)
                        .filter(a => a.data === day.toISOString().split('T')[0]);
                      
                      return (
                        <td
                          key={dayIndex}
                          className={`p-2 align-top border-l border-purple-50 ${
                            isToday(day) ? 'bg-purple-50/50' : ''
                          }`}
                          onDoubleClick={() => onDoubleClickSlot && onDoubleClickSlot(day, funcionario.id)}
                        >
                          <div className="space-y-1 min-h-[60px]">
                            {dayAgendamentos.map((agendamento) => {
                              const cliente = clientes.find(c => c.id === agendamento.cliente_id);
                              const servico = servicos.find(s => s.id === agendamento.servico_id);
                              
                              return (
                                <AgendamentoCard
                                  key={agendamento.id}
                                  agendamento={agendamento}
                                  cliente={cliente}
                                  servico={servico}
                                  onClick={() => onAgendamentoClick(agendamento)}
                                  colors={colors}
                                  calcularHoraFim={calcularHoraFim}
                                />
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
