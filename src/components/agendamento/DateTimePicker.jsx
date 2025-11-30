import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DIAS_SEMANA = ["Do", "Se", "Te", "Qa", "Qi", "Se", "Sá"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const HORARIOS_PADRAO = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
];

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

  const handleDateClick = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      return;
    }
    handleDateChange(date);
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
      
      days.push(
        <button
          key={day}
          type="button"
          disabled={past}
          onClick={() => handleDateClick(day)}
          className={cn(
            "text-center py-2 rounded-lg transition-colors",
            past && "text-gray-300 cursor-not-allowed",
            !past && !selected && "hover:bg-purple-50 text-gray-700",
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
          
          {selectedDate && (
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {HORARIOS_PADRAO.map((horario) => (
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
