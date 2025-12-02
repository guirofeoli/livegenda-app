import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import AgendamentoCard from "./AgendamentoCard";

const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

// Cores por status do agendamento
const STATUS_COLORS = {
  pendente: "bg-blue-100 text-blue-900 border-blue-300",
  agendado: "bg-blue-100 text-blue-900 border-blue-300",
  confirmado: "bg-green-100 text-green-900 border-green-300",
  cancelado: "bg-red-100 text-red-900 border-red-300",
};

// Paleta de cores pasteis da identidade visual
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

// Mapeamento de índice de dia para abreviação
const DIAS_ABREVIADOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const DIAS_NOMES = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export default function WeekByFuncionarioView({
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
    // Normalizar a data para evitar problemas de timezone
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
  // Usa dias_funcionamento da empresa (ex: ['seg', 'ter', 'qua', 'qui', 'sex'])
  // ou horario_funcionamento estruturado (ex: { segunda: { ativo: true, ... } })
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
    return dayIndex === 0 || dayIndex === 6; // dom e sab fechados por default
  };

  // Filtrar apenas dias abertos
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
            <div
              key={funcionario.id}
              className={`bg-white rounded-xl border-2 ${colors.border} overflow-hidden`}
            >
              <div className="p-3 bg-gradient-to-r from-purple-50 to-white border-b-2 border-inherit">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 bg-gradient-to-br ${colors.bg} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${colors.shadow}`}>
                    {funcionario.nome_completo?.substring(0, 2).toUpperCase() || "??"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {funcionario.nome_completo}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{funcionario.cargo}</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {funcAgendamentos.length} agendamento{funcAgendamentos.length !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="p-3 space-y-2">
                {funcAgendamentos.map((agendamento) => {
                  const cliente = clientes.find(c => c.id === agendamento.cliente_id);
                  const servico = servicos.find(s => s.id === agendamento.servico_id);
                  const horaFim = calcularHoraFim(agendamento);

                  const statusColors = STATUS_COLORS[agendamento.status] || STATUS_COLORS.agendado;

                  return (
                    <div key={agendamento.id} className="space-y-1">
                      <div className="text-xs text-gray-500 font-medium">
                        {formatDate(agendamento.data)} • {agendamento.hora_inicio} - {horaFim}
                      </div>
                      <button
                        onClick={() => onAgendamentoClick(agendamento)}
                        className={`${statusColors} p-2.5 text-left rounded-lg w-full border-l-4 transition-all hover:shadow-md`}
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-xs">
                            {cliente?.nome_completo || "Cliente"}
                          </p>
                          <p className="text-xs opacity-90">
                            {servico?.nome || "Serviço"}
                          </p>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop/Tablet View - Grade */}
      <div className="hidden md:block bg-white rounded-xl border border-purple-100 overflow-hidden">
        {/* Header com dias da semana */}
        <div 
          className="border-b border-purple-100 sticky top-0 bg-white z-10"
          style={{
            display: 'grid',
            gridTemplateColumns: `140px 50px repeat(${weekDays.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="p-2 lg:p-4 text-xs text-gray-500 font-medium border-r border-purple-100">
            Profissional
          </div>
          <div className="p-2 lg:p-4 text-xs text-gray-500 font-medium border-r border-purple-100">

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

        {/* Grade por funcionário e horário */}
        <div className="overflow-auto">
          {funcionariosFiltrados.map((funcionario, funcionarioIndex) => {
            const horariosComAgendamentos = getHorariosComAgendamentos(funcionario.id);
            const colors = COLOR_PALETTE[funcionarioIndex % COLOR_PALETTE.length];
            
            if (horariosComAgendamentos.length === 0) {
              return null;
            }

            return (
              <div 
                key={funcionario.id} 
                className={`border-b-2 ${colors.border}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `140px 50px repeat(${weekDays.length}, minmax(0, 1fr))`,
                }}
              >
                {/* Coluna do nome do funcionário - ocupa todas as linhas */}
                <div 
                  className={`sticky left-0 bg-white border-r-2 ${colors.border} p-2 lg:p-3 flex items-center gap-2 lg:gap-3`}
                  style={{ gridRow: `span ${horariosComAgendamentos.length}` }}
                >
                  <div className={`w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br ${colors.bg} rounded-full flex items-center justify-center text-white font-bold text-xs lg:text-sm shadow-lg ${colors.shadow} flex-shrink-0`}>
                    {funcionario.nome_completo?.substring(0, 2).toUpperCase() || "??"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs lg:text-sm font-medium text-gray-900 truncate">
                      {funcionario.nome_completo}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{funcionario.cargo}</p>
                  </div>
                </div>

                {/* Horários e células dos dias */}
                {horariosComAgendamentos.map((hora, horaIdx) => (
                  <React.Fragment key={hora}>
                    {/* Coluna de horários */}
                    <div className={`border-r border-purple-100 ${horaIdx < horariosComAgendamentos.length - 1 ? 'border-b border-purple-50' : ''} p-2 lg:p-3 flex items-center justify-center bg-gray-50`} style={{ minHeight: '60px' }}>
                      <span className="text-xs text-gray-600 font-medium">
                        {String(hora).padStart(2, '0')}:00
                      </span>
                    </div>

                    {/* Células dos dias para esse horário */}
                    {weekDays.map((day, dayIdx) => {
                      const slotAgendamentos = getAgendamentosForSlot(funcionario.id, day, hora);

                      return (
                        <div
                          key={dayIdx}
                          className={`border-l border-purple-100 ${horaIdx < horariosComAgendamentos.length - 1 ? 'border-b border-purple-50' : ''} p-1 lg:p-2 relative`}
                          style={{ minHeight: slotAgendamentos.length > 1 ? `${slotAgendamentos.length * 80}px` : '60px' }}
                          onDoubleClick={() => onDoubleClickSlot(day, `${String(hora).padStart(2, '0')}:00`)}
                        >
                          <div className="flex flex-col gap-1">
                            {slotAgendamentos.map((agendamento) => {
                              const cliente = clientes.find(c => c.id === agendamento.cliente_id);
                              const servico = servicos.find(s => s.id === agendamento.servico_id);
                              const funcionarioData = funcionarios.find(f => f.id === agendamento.funcionario_id);

                              return (
                                <AgendamentoCard
                                  key={agendamento.id}
                                  agendamento={agendamento}
                                  cliente={cliente}
                                  servico={servico}
                                  funcionario={funcionarioData}
                                  onClick={() => onAgendamentoClick(agendamento)}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
