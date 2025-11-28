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
  onClick,
  compact = false
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

  // Modo compacto: apenas mostra uma barra colorida indicando continuação
  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "h-full w-full rounded-lg border-l-4 transition-all hover:shadow-md opacity-60",
          colorClass
        )}
        title={`${cliente?.nome_completo || "Cliente"} - ${servico?.nome || "Serviço"}`}
      />
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2 text-left rounded-lg w-full h-full border-l-4 transition-all hover:shadow-md hover:scale-[1.01] overflow-hidden",
        colorClass
      )}
    >
      <div className="space-y-0.5">
        <p className="font-semibold text-sm truncate leading-tight">
          {cliente?.nome_completo || "Cliente não encontrado"}
        </p>
        <p className="text-xs truncate opacity-90 leading-tight">
          {servico?.nome || "Serviço"}
        </p>
        <div className="flex items-center gap-1 text-xs opacity-80">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span>{agendamento.hora_inicio} - {horaFim}</span>
        </div>
        <div className="flex items-center gap-1 text-xs opacity-80">
          <User className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{funcionario?.nome_completo || "Profissional"}</span>
        </div>
      </div>
    </button>
  );
}
