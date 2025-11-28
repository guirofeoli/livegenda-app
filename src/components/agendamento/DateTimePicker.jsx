import { useState } from "react";
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
      try {
        const result = await base44.entities.ConfiguracaoNegocio.get();
        return result;
      } catch (error) {
        console.error('Erro ao buscar configuração:', error);
        return null;
      }
    }
  });

  // Buscar todos os agendamentos
  const { data: agendamentos = [] } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: async () => {
      try {
        const result = await base44.entities.Agendamento.list();
        return result || [];
      } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        return [];
      }
    }
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

  const handleTimeClick = (horario) => {
    onSelectTime(horario);
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
          type="button"
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
    <div className="bg-white rounded-2xl border border-purple-100 p-6 space-y-6">
      {/* Calendário */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Button 
            type="button"
            variant="ghost" 
            size="icon" 
            onClick={prevMonth}
            className="hover:bg-purple-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-semibold text-gray-900">
            {MESES[currentMonth]} {currentYear}
          </h3>
          <Button 
            type="button"
            variant="ghost" 
            size="icon" 
            onClick={nextMonth}
            className="hover:bg-purple-50"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {DIAS_SEMANA.map((dia, index) => (
            <div key={index} className="text-center py-2 text-sm font-medium text-gray-500">
              {dia}
            </div>
          ))}
          {renderCalendarDays()}
        </div>
      </div>

      {/* Horários Disponíveis */}
      <div>
        <h3 className="font-semibold mb-3">Horários disponíveis</h3>
        
        {!funcionarioId && (
          <p className="text-sm text-gray-500">Selecione um profissional primeiro</p>
        )}
        
        {!duracaoServico && funcionarioId && (
          <p className="text-sm text-gray-500">Selecione um serviço primeiro</p>
        )}
        
        {funcionarioId && duracaoServico && !selectedDate && (
          <p className="text-sm text-gray-500">Selecione uma data primeiro</p>
        )}
        
        {funcionarioId && duracaoServico && selectedDate && horarios.length === 0 && (
          <p className="text-sm text-gray-500">
            {configuracao && !isDiaAtivo(selectedDate.toISOString().split('T')[0], configuracao)
              ? "Empresa fechada neste dia"
              : "Nenhum horário disponível para este dia"}
          </p>
        )}
        
        {funcionarioId && duracaoServico && selectedDate && horarios.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {horarios.map((horario) => (
              <Button
                key={horario}
                type="button"
                variant={selectedTime === horario ? "default" : "outline"}
                className={cn(
                  "text-sm",
                  selectedTime === horario && "bg-purple-500 hover:bg-purple-600"
                )}
                onClick={() => handleTimeClick(horario)}
              >
                {horario}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
