import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { livegenda } from "@/api/livegendaClient";
import { useQuery } from "@tanstack/react-query";

const DIAS_SEMANA = ["Do", "Se", "Te", "Qa", "Qi", "Se", "Sá"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Gerar horários baseado no horário de funcionamento
const gerarHorarios = (abertura, fechamento, intervalo = 30) => {
  const horarios = [];
  const [horaAbertura, minAbertura] = abertura.split(':').map(Number);
  const [horaFechamento, minFechamento] = fechamento.split(':').map(Number);
  
  let hora = horaAbertura;
  let minuto = minAbertura;
  
  while (hora < horaFechamento || (hora === horaFechamento && minuto < minFechamento)) {
    horarios.push(`${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`);
    minuto += intervalo;
    if (minuto >= 60) {
      hora += Math.floor(minuto / 60);
      minuto = minuto % 60;
    }
  }
  
  return horarios;
};

// Mapear dia da semana (0-6) para chave do horário
const getDiaKey = (dayOfWeek) => {
  const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return dias[dayOfWeek];
};

export default function DateTimePicker({ 
  selectedDate, 
  selectedTime, 
  onDateChange,
  onTimeChange,
  onSelectDate,
  onSelectTime
}) {
  const handleDateChange = onDateChange || onSelectDate;
  const handleTimeChange = onTimeChange || onSelectTime;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Buscar configuração da empresa
  const { data: configuracao } = useQuery({
    queryKey: ['configuracao'],
    queryFn: () => livegenda.entities.ConfiguracaoNegocio.get(),
    staleTime: 5 * 60 * 1000 // 5 minutos
  });

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
  const today = new Date();

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Verificar se dia está ativo no horário de funcionamento
  const isDiaAtivo = (date) => {
    if (!configuracao?.horario_funcionamento) return true;
    
    const diaKey = getDiaKey(date.getDay());
    const horarioDia = configuracao.horario_funcionamento[diaKey];
    
    return horarioDia?.ativo !== false;
  };

  // Obter horários para o dia selecionado
  const getHorariosParaDia = () => {
    if (!selectedDate) return [];
    
    if (!configuracao?.horario_funcionamento) {
      // Horários padrão se não tiver configuração
      return gerarHorarios("09:00", "18:00");
    }
    
    const diaKey = getDiaKey(selectedDate.getDay());
    const horarioDia = configuracao.horario_funcionamento[diaKey];
    
    if (!horarioDia || horarioDia.ativo === false) {
      return [];
    }
    
    const abertura = horarioDia.abertura || horarioDia.inicio || "09:00";
    const fechamento = horarioDia.fechamento || horarioDia.fim || "18:00";
    
    return gerarHorarios(abertura, fechamento);
  };

  const handleDateClick = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      return;
    }
    if (!isDiaAtivo(date)) {
      return;
    }
    handleDateChange(date);
    // Reset time quando mudar data
    if (handleTimeChange) {
      handleTimeChange(null);
    }
  };

  const handleTimeClick = (horario) => {
    handleTimeChange(horario);
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === today.toDateString();
  };

  const isPast = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const isDiaDisponivel = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    if (isPast(day)) return false;
    return isDiaAtivo(date);
  };

  const renderCalendarDays = () => {
    const days = [];
    
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      days.push(
        <div key={`prev-${day}`} className="text-center py-2 text-gray-300">
          {day}
        </div>
      );
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const selected = isSelected(day);
      const todayDay = isToday(day);
      const past = isPast(day);
      const disponivel = isDiaDisponivel(day);
      
      days.push(
        <button
          key={day}
          type="button"
          disabled={past || !disponivel}
          onClick={() => handleDateClick(day)}
          className={cn(
            "text-center py-2 rounded-lg transition-colors",
            (past || !disponivel) && "text-gray-300 cursor-not-allowed",
            !past && disponivel && !selected && "hover:bg-purple-50 text-gray-700",
            selected && "bg-purple-500 text-white",
            todayDay && !selected && "ring-2 ring-purple-300"
          )}
        >
          {day}
        </button>
      );
    }
    
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(
        <div key={`next-${day}`} className="text-center py-2 text-gray-300">
          {day}
        </div>
      );
    }
    
    return days;
  };

  const horarios = getHorariosParaDia();

  return (
    <div className="bg-white rounded-xl border border-purple-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Data e Horário
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <h4 className="font-semibold text-gray-900">
              {MESES[currentMonth]} {currentYear}
            </h4>
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

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} className="text-center text-xs font-medium text-gray-500 py-2">
                {dia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {renderCalendarDays()}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-gray-900">Horários disponíveis</h4>
          
          {!selectedDate && (
            <p className="text-sm text-gray-500">Selecione uma data primeiro</p>
          )}
          
          {selectedDate && horarios.length === 0 && (
            <p className="text-sm text-gray-500">Empresa fechada neste dia</p>
          )}
          
          {selectedDate && horarios.length > 0 && (
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {horarios.map((horario) => (
                <Button
                  key={horario}
                  type="button"
                  variant={selectedTime === horario ? "default" : "outline"}
                  size="sm"
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
    </div>
  );
}
