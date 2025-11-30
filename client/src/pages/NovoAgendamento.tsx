import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar as CalendarIcon, Clock, Loader2 } from "lucide-react";
import { format, addMinutes, setHours, setMinutes, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";

interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
}

interface Funcionario {
  id: string;
  nome: string;
  cor: string | null;
}

interface Servico {
  id: string;
  nome: string;
  duracao_minutos: number;
  preco: string;
}

interface HorarioFuncionamento {
  [dia: string]: {
    ativo: boolean;
    inicio: string;
    fim: string;
  };
}

const diasSemana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

export default function NovoAgendamento() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [clienteId, setClienteId] = useState<string>("");
  const [funcionarioId, setFuncionarioId] = useState<string>("");
  const [servicoId, setServicoId] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [horarioFuncionamento, setHorarioFuncionamento] = useState<HorarioFuncionamento | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("livegenda_user");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setEmpresaId(user.empresaId);
      }
    } catch {
      console.error("Erro ao obter dados do usuário");
    }
  }, []);

  useEffect(() => {
    if (!empresaId) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [clientesRes, funcionariosRes, servicosRes, empresaRes] = await Promise.all([
          fetch(`/api/clientes?empresa_id=${empresaId}`),
          fetch(`/api/funcionarios?empresa_id=${empresaId}`),
          fetch(`/api/servicos?empresa_id=${empresaId}`),
          fetch(`/api/empresas/${empresaId}`),
        ]);

        if (clientesRes.ok) {
          const data = await clientesRes.json();
          setClientes(Array.isArray(data) ? data : []);
        }

        if (funcionariosRes.ok) {
          const data = await funcionariosRes.json();
          setFuncionarios(Array.isArray(data) ? data.filter((f: any) => f.ativo !== false) : []);
        }

        if (servicosRes.ok) {
          const data = await servicosRes.json();
          setServicos(Array.isArray(data) ? data.filter((s: any) => s.ativo !== false) : []);
        }

        if (empresaRes.ok) {
          const empresa = await empresaRes.json();
          if (empresa.horario_funcionamento) {
            setHorarioFuncionamento(empresa.horario_funcionamento);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [empresaId, toast]);

  const gerarHorarios = (): string[] => {
    if (!selectedDate || !horarioFuncionamento) {
      return gerarHorariosPadrao();
    }

    const diaSemana = diasSemana[selectedDate.getDay()];
    const config = horarioFuncionamento[diaSemana];

    if (!config || !config.ativo) {
      return [];
    }

    const horarios: string[] = [];
    const [inicioHora, inicioMin] = config.inicio.split(":").map(Number);
    const [fimHora, fimMin] = config.fim.split(":").map(Number);

    let atual = setMinutes(setHours(new Date(), inicioHora), inicioMin);
    const fim = setMinutes(setHours(new Date(), fimHora), fimMin);

    while (isBefore(atual, fim)) {
      horarios.push(format(atual, "HH:mm"));
      atual = addMinutes(atual, 30);
    }

    return horarios;
  };

  const gerarHorariosPadrao = (): string[] => {
    const horarios: string[] = [];
    for (let hora = 8; hora < 20; hora++) {
      horarios.push(`${hora.toString().padStart(2, "0")}:00`);
      horarios.push(`${hora.toString().padStart(2, "0")}:30`);
    }
    return horarios;
  };

  const isDiaFechado = (date: Date): boolean => {
    if (!horarioFuncionamento) return false;
    
    const diaSemana = diasSemana[date.getDay()];
    const config = horarioFuncionamento[diaSemana];
    
    return !config || !config.ativo;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !clienteId || !funcionarioId || !servicoId || !empresaId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const [hora, minuto] = selectedTime.split(":").map(Number);
      const dataHora = new Date(selectedDate);
      dataHora.setHours(hora, minuto, 0, 0);

      const response = await fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa_id: empresaId,
          cliente_id: clienteId,
          funcionario_id: funcionarioId,
          servico_id: servicoId,
          data_hora: dataHora.toISOString(),
          observacoes: observacoes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar agendamento");
      }

      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso!",
      });

      navigate("/agendamentos");
    } catch (err: any) {
      console.error("Erro ao criar agendamento:", err);
      toast({
        title: "Erro",
        description: err.message || "Não foi possível criar o agendamento",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const servicoSelecionado = servicos.find((s) => s.id === servicoId);
  const horarios = gerarHorarios();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/agendamentos")} data-testid="button-voltar">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-titulo-novo-agendamento">Novo Agendamento</h1>
          <p className="text-muted-foreground">Preencha os dados para criar um agendamento</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Data e Horário
            </CardTitle>
            <CardDescription>Selecione quando será o atendimento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setSelectedTime("");
              }}
              locale={ptBR}
              disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date())) || isDiaFechado(date)}
              className="rounded-md border w-full"
              data-testid="calendar-novo-agendamento"
            />

            {selectedDate && (
              <div className="space-y-2">
                <Label>Horário</Label>
                {horarios.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Empresa fechada neste dia
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {horarios.map((horario) => (
                      <Button
                        key={horario}
                        variant={selectedTime === horario ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(horario)}
                        data-testid={`button-horario-${horario}`}
                      >
                        {horario}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Agendamento</CardTitle>
            <CardDescription>Selecione o cliente, profissional e serviço</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger id="cliente" data-testid="select-cliente">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhum cliente cadastrado
                    </SelectItem>
                  ) : (
                    clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="funcionario">Profissional *</Label>
              <Select value={funcionarioId} onValueChange={setFuncionarioId}>
                <SelectTrigger id="funcionario" data-testid="select-funcionario">
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {funcionarios.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhum profissional cadastrado
                    </SelectItem>
                  ) : (
                    funcionarios.map((funcionario) => (
                      <SelectItem key={funcionario.id} value={funcionario.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: funcionario.cor || "#6366f1" }}
                          />
                          {funcionario.nome}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico">Serviço *</Label>
              <Select value={servicoId} onValueChange={setServicoId}>
                <SelectTrigger id="servico" data-testid="select-servico">
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {servicos.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhum serviço cadastrado
                    </SelectItem>
                  ) : (
                    servicos.map((servico) => (
                      <SelectItem key={servico.id} value={servico.id}>
                        {servico.nome} - R$ {parseFloat(servico.preco).toFixed(2)} ({servico.duracao_minutos}min)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {servicoSelecionado && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium">{servicoSelecionado.nome}</p>
                <p className="text-muted-foreground">
                  Duração: {servicoSelecionado.duracao_minutos} minutos
                </p>
                <p className="text-primary font-medium">
                  R$ {parseFloat(servicoSelecionado.preco).toFixed(2)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações adicionais..."
                className="resize-none"
                rows={3}
                data-testid="textarea-observacoes"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate("/agendamentos")} data-testid="button-cancelar">
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !selectedDate || !selectedTime || !clienteId || !funcionarioId || !servicoId}
          data-testid="button-criar-agendamento"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando...
            </>
          ) : (
            "Criar Agendamento"
          )}
        </Button>
      </div>
    </div>
  );
}
