import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { getHorariosDisponiveis, isDiaAtivo } from "@/utils/horariosDisponiveis";

const DIAS_SEMANA = ["Do", "Se", "Te", "Qa", "Qi", "Se", "Sá"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function DateTimePicker({ 
  selectedDate, 
  selectedTime, 
  onSelectDate, 
  onSelectTime,
  funcionarioId,
  duracaoServico
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Buscar configuração
  const { data: configuracao } = useQuery({
    queryKey: ['configuracao'],
    queryFn: async () => {
      const { data } = await base44.entities.ConfiguracaoNegocio.get();
      return data;
    }
  });

  // Buscar todos os agendamentos
  const { data: agendamentos = [] } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => base44.entities.Agendamento.list(),
    initialData: []
  });

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleDateClick = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = date.toISOString().split('T')[0];
    
    // Verificar se o dia está ativo
    if (configuracao && !isDiaAtivo(dateString, configuracao)) {
      return; // Não permite selecionar dia inativo
    }
    
    onSelectDate(date);
    onSelectTime(null); // Reset time quando mudar data
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === selectedDate.toDateString();
  };

  const isDiaDisponivel = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = date.toISOString().split('T')[0];
    
    if (!configuracao) return true;
    return isDiaAtivo(dateString, configuracao);
  };

  const horariosDisponiveis = () => {
    if (!selectedDate || !configuracao || !funcionarioId || !duracaoServico) {
      return [];
    }
    
    const dateString = selectedDate.toISOString().split('T')[0];
    return getHorariosDisponiveis(
      funcionarioId,
      dateString,
      duracaoServico,
      configuracao,
      agendamentos
    );
  };

  const horarios = horariosDisponiveis();

  const renderCalendarDays = () => {
    const days = [];
    
    // Dias do mês anterior
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      days.push(
        <div key={`prev-${day}`} className="text-center py-2 text-gray-300">
          {day}
        </div>
      );
    }
    
    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const disponivel = isDiaDisponivel(day);
      const selected = isSelected(day);
      
      days.push(
        <button
          key={day}
          onClick={() => disponivel && handleDateClick(day)}
          disabled={!disponivel}
          className={cn(
            "text-center py-2 rounded-lg transition-all",
            disponivel ? "hover:bg-purple-50 cursor-pointer" : "text-gray-300 cursor-not-allowed",
            selected && "bg-purple-500 text-white font-bold hover:bg-purple-600"
          )}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Calendário */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h3 className="font-semibold">
            {MESES[currentMonth]} {currentYear}
          </h3>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {DIAS_SEMANA.map((dia, i) => (
            <div key={i} className="text-center text-sm font-medium text-gray-500">
              {dia}
            </div>
          ))}
          {renderCalendarDays()}
        </div>
      </div>

      {/* Horários Disponíveis */}
      {selectedDate && (
        <div>
          <h3 className="font-semibold mb-3">Horários disponíveis</h3>
          
          {!funcionarioId && (
            <p className="text-sm text-gray-500">Selecione um profissional primeiro</p>
          )}
          
          {!duracaoServico && funcionarioId && (
            <p className="text-sm text-gray-500">Selecione um serviço primeiro</p>
          )}
          
          {funcionarioId && duracaoServico && horarios.length === 0 && (
            <p className="text-sm text-gray-500">
              {configuracao && !isDiaAtivo(selectedDate.toISOString().split('T')[0], configuracao)
                ? "Empresa fechada neste dia"
                : "Nenhum horário disponível para este dia"}
            </p>
          )}
          
          {funcionarioId && duracaoServico && horarios.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {horarios.map((horario) => (
                <Button
                  key={horario}
                  variant={selectedTime === horario ? "default" : "outline"}
                  className={cn(
                    "text-sm",
                    selectedTime === horario && "bg-purple-500 hover:bg-purple-600"
                  )}
                  onClick={() => onSelectTime(horario)}
                >
                  {horario}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
