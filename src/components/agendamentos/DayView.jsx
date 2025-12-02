import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import AgendamentoCard from "./AgendamentoCard";

const HORARIOS = Array.from({ length: 14 }, (_, i) => i + 9); // 9h às 22h

// Mapeamento de índice de dia para abreviação
const DIAS_ABREVIADOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const DIAS_NOMES = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export default function DayView({
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
  // Verificar se o estabelecimento está aberto no dia atual
  const isEstabelecimentoFechado = () => {
    const dayIndex = currentDate.getDay();
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

  const fechado = isEstabelecimentoFechado();

  const getAgendamentosForHour = (hour) => {
    const dateString = currentDate.toISOString().split('T')[0];
    return agendamentos.filter(agendamento => {
      if (agendamento.data !== dateString) return false;
      const agendHour = parseInt(agendamento.hora_inicio.split(':')[0]);
      const matchHour = agendHour === hour;
      const matchFuncionario = !selectedFuncionarioId || agendamento.funcionario_id === selectedFuncionarioId;
      return matchHour && matchFuncionario;
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-purple-100 p-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-purple-100 overflow-hidden">
      {/* Header com a data */}
      <div className="border-b border-purple-100 p-3 md:p-4 bg-purple-50">
        <h2 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900 capitalize">
          {formatDate(currentDate)}
        </h2>
      </div>

      {/* Grade de horários */}
      <div className="overflow-auto">
        {HORARIOS.map((hora) => {
          const hourAgendamentos = getAgendamentosForHour(hora);
          
          return (
            <div
              key={hora}
              className="grid grid-cols-[60px_1fr] md:grid-cols-[70px_1fr] lg:grid-cols-[80px_1fr] border-b border-purple-50 hover:bg-purple-50/30 transition-colors"
              style={{ minHeight: '60px' }}
            >
              {/* Coluna de horário */}
              <div className="p-2 md:p-3 text-xs md:text-sm text-gray-500 font-medium border-r border-purple-100 flex items-start">
                {hora}:00
              </div>

              {/* Coluna de agendamentos */}
              <div
                className={`p-2 md:p-3 relative ${fechado ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                onDoubleClick={() => !fechado && onDoubleClickSlot(currentDate, `${hora}:00`)}
              >
                {hourAgendamentos.length > 0 ? (
                  <div className="grid gap-2 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {hourAgendamentos.map((agendamento) => {
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
                  <div className="h-full flex items-center text-gray-300 text-xs">
                    Sem agendamentos
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
