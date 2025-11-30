import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar as CalendarIcon, Clock, User, Scissors, Phone, RefreshCw } from "lucide-react";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation, useSearch } from "wouter";

interface Agendamento {
  id: string;
  empresa_id: string;
  cliente_id: string;
  funcionario_id: string;
  servico_id: string;
  data_hora: string;
  data_hora_fim: string;
  status: string;
  observacoes: string | null;
  preco_final: string | null;
  criado_em: string;
  cliente: {
    id: string;
    nome: string;
    telefone: string | null;
  };
  funcionario: {
    id: string;
    nome: string;
    cor: string | null;
  };
  servico: {
    id: string;
    nome: string;
    duracao_minutos: number;
    preco: string;
  };
}

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  concluido: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  nao_compareceu: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  nao_compareceu: "Não compareceu",
};

export default function Agendamentos() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  
  // Pegar data da URL se existir (após criar agendamento)
  const getInitialDate = () => {
    const params = new URLSearchParams(searchString);
    const dataParam = params.get("data");
    if (dataParam) {
      const date = new Date(dataParam);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return new Date();
  };

  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate);
  const [displayedMonth, setDisplayedMonth] = useState<Date>(getInitialDate);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresa_id, setEmpresaId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("livegenda_user");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setEmpresaId(user.empresa_id);
      }
    } catch {
      console.error("Erro ao obter dados do usuário");
    }
  }, []);

  // Função para buscar agendamentos do mês
  const fetchAgendamentos = useCallback(async (mesReferencia: Date) => {
    if (!empresa_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Buscar agendamentos do mês (com margem de 1 semana antes e depois)
      const dataInicio = subMonths(startOfMonth(mesReferencia), 0).toISOString();
      const dataFim = addMonths(endOfMonth(mesReferencia), 0).toISOString();
      
      const response = await fetch(
        `/api/agendamentos?empresa_id=${empresa_id}&data_inicio=${dataInicio}&data_fim=${dataFim}`
      );
      
      if (!response.ok) {
        throw new Error("Erro ao carregar agendamentos");
      }
      
      const data = await response.json();
      setAgendamentos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar agendamentos:", err);
      setError("Não foi possível carregar os agendamentos");
    } finally {
      setLoading(false);
    }
  }, [empresa_id]);

  // Buscar agendamentos quando o mês muda ou empresa é carregada
  useEffect(() => {
    if (empresa_id) {
      fetchAgendamentos(displayedMonth);
    }
  }, [empresa_id, displayedMonth, fetchAgendamentos]);

  // Função para atualizar manualmente
  const handleRefresh = () => {
    fetchAgendamentos(displayedMonth);
  };

  // Quando o mês visível do calendário muda
  const handleMonthChange = (date: Date) => {
    setDisplayedMonth(date);
  };

  const agendamentosDoDia = agendamentos.filter((agendamento) => {
    const dataAgendamento = parseISO(agendamento.data_hora);
    return isSameDay(dataAgendamento, selectedDate);
  }).sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

  const datasComAgendamento = agendamentos.map((a) => parseISO(a.data_hora));

  const handleNovoAgendamento = () => {
    navigate("/novo-agendamento");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-titulo-agendamentos">Agendamentos</h1>
          <p className="text-muted-foreground">
            {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading} data-testid="button-atualizar">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={handleNovoAgendamento} data-testid="button-novo-agendamento">
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={displayedMonth}
              onMonthChange={handleMonthChange}
              locale={ptBR}
              className="rounded-md border w-full"
              modifiers={{
                hasAppointment: datasComAgendamento,
              }}
              modifiersStyles={{
                hasAppointment: {
                  fontWeight: "bold",
                  textDecoration: "underline",
                },
              }}
              data-testid="calendar-agendamentos"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Agendamentos do Dia
              {!loading && (
                <Badge variant="secondary" className="ml-2" data-testid="badge-quantidade-agendamentos">
                  {agendamentosDoDia.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="h-64 flex items-center justify-center text-destructive" data-testid="text-erro-agendamentos">
                {error}
              </div>
            ) : agendamentosDoDia.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground" data-testid="text-sem-agendamentos">
                <CalendarIcon className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum agendamento</p>
                <p className="text-sm">Não há agendamentos para esta data</p>
              </div>
            ) : (
              <div className="space-y-4" data-testid="list-agendamentos">
                {agendamentosDoDia.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className="flex gap-4 p-4 border rounded-lg hover-elevate transition-colors cursor-pointer"
                    style={{
                      borderLeftWidth: "4px",
                      borderLeftColor: agendamento.funcionario?.cor || "#6366f1",
                    }}
                    data-testid={`card-agendamento-${agendamento.id}`}
                  >
                    <div className="flex flex-col items-center justify-center min-w-16 text-center">
                      <span className="text-2xl font-bold" data-testid={`text-hora-${agendamento.id}`}>
                        {format(parseISO(agendamento.data_hora), "HH:mm")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        até {format(parseISO(agendamento.data_hora_fim), "HH:mm")}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium truncate" data-testid={`text-cliente-${agendamento.id}`}>
                          {agendamento.cliente?.nome || "Cliente"}
                        </span>
                        <Badge className={statusColors[agendamento.status] || statusColors.pendente}>
                          {statusLabels[agendamento.status] || agendamento.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Scissors className="h-3 w-3" />
                        <span data-testid={`text-servico-${agendamento.id}`}>
                          {agendamento.servico?.nome || "Serviço"}
                        </span>
                        <span className="text-xs">
                          ({agendamento.servico?.duracao_minutos || 0} min)
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: agendamento.funcionario?.cor || "#6366f1" }}
                          />
                          <span data-testid={`text-funcionario-${agendamento.id}`}>
                            {agendamento.funcionario?.nome || "Profissional"}
                          </span>
                        </div>
                        {agendamento.cliente?.telefone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{agendamento.cliente.telefone}</span>
                          </div>
                        )}
                      </div>

                      {agendamento.preco_final && (
                        <div className="mt-2 text-sm font-medium text-primary" data-testid={`text-preco-${agendamento.id}`}>
                          R$ {parseFloat(agendamento.preco_final).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
