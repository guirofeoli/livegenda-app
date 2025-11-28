import React from "react";
import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS = {
  Agendado: "bg-blue-100 border-blue-300 text-blue-900",
  Confirmado: "bg-green-100 border-green-300 text-green-900",
  Cancelado: "bg-red-100 border-red-300 text-red-900",
  Concluído: "bg-purple-100 border-purple-300 text-purple-900"
};

export default function AgendamentoCard({
  agendamento,
  cliente,
  servico,
  funcionario,
  onClick
}) {
  const calcularHoraFim = () => {
    if (!agendamento.hora_inicio || !agendamento.duracao_minutos) return "";

    const [hora, minuto] = agendamento.hora_inicio.split(':').map(Number);
    const totalMinutos = hora * 60 + minuto + agendamento.duracao_minutos;
    const horaFim = Math.floor(totalMinutos / 60);
    const minutoFim = totalMinutos % 60;

    return `${String(horaFim).padStart(2, '0')}:${String(minutoFim).padStart(2, '0')}`;
  };

  const horaFim = calcularHoraFim();
  const colorClass = STATUS_COLORS[agendamento.status] || STATUS_COLORS.Agendado;

  return (
    <button
      onClick={onClick}
      className={cn(
        "my-1 p-2 text-left rounded-lg w-full border-l-4 transition-all hover:shadow-md hover:scale-[1.02]",
        colorClass
      )}
    >
      <div className="space-y-1">
        <p className="font-semibold text-sm truncate">
          {cliente?.nome_completo || "Cliente não encontrado"}
        </p>
        <p className="text-xs truncate opacity-90">
          {servico?.nome || "Serviço"}
        </p>
        <div className="flex items-center gap-1 text-xs opacity-80">
          <Clock className="w-3 h-3" />
          <span>{agendamento.hora_inicio} - {horaFim}</span>
        </div>
        <div className="flex items-center gap-1 text-xs opacity-80">
          <User className="w-3 h-3" />
          <span className="truncate">{funcionario?.nome_completo || "Profissional"}</span>
        </div>
      </div>
    </button>
  );
}