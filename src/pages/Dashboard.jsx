import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, TrendingUp, Users, Star } from "lucide-react";
import { format, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const currentUser = JSON.parse(localStorage.getItem('livegenda_user') || '{}');
  const funcionarioId = currentUser.funcionario_id;
  const empresaId = currentUser.empresa_id;

  // Buscar dados do funcionário
  const { data: funcionariosData = [] } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: () => base44.entities.Funcionario.list(),
    initialData: [],
  });
  
  const funcionario = funcionariosData.find(f => f.id === funcionarioId) || {};

  // Buscar agendamentos do funcionário
  const { data: agendamentosData = [] } = useQuery({
    queryKey: ['agendamentos'],
    queryFn: () => base44.entities.Agendamento.list(),
    initialData: [],
  });

  const agendamentos = agendamentosData.filter(
    a => a.funcionario_id === funcionarioId && a.empresa_id === empresaId
  );

  // Calcular métricas
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - hoje.getDay());

  const agendamentosHoje = agendamentos.filter(a => a.data === format(hoje, 'yyyy-MM-dd'));
  const agendamentosSemana = agendamentos.filter(a => {
    const dataAgendamento = new Date(a.data + 'T00:00:00');
    return dataAgendamento >= inicioSemana && dataAgendamento <= hoje;
  });
  const agendamentosMes = agendamentos.filter(a => {
    const dataAgendamento = new Date(a.data + 'T00:00:00');
    return dataAgendamento >= inicioMes && dataAgendamento <= hoje;
  });

  // Clientes únicos atendidos
  const clientesUnicos = new Set(agendamentos.map(a => a.cliente_id)).size;

  // Tempo de empresa
  const dataVinculacao = funcionario.data_vinculacao ? new Date(funcionario.data_vinculacao) : hoje;
  const mesesEmpresa = differenceInMonths(hoje, dataVinculacao);

  // Próximos agendamentos
  const proximosAgendamentos = agendamentos
    .filter(a => {
      const dataAgendamento = new Date(a.data + 'T00:00:00');
      return dataAgendamento >= hoje;
    })
    .sort((a, b) => {
      const dataA = new Date(a.data + 'T' + a.hora_inicio);
      const dataB = new Date(b.data + 'T' + b.hora_inicio);
      return dataA - dataB;
    })
    .slice(0, 5);

  // Avaliação média (mockado)
  const avaliacaoMedia = 4.8;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Meu Dashboard
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Olá, {funcionario.nome_completo || 'Funcionário'}! Aqui está um resumo do seu desempenho.
        </p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <Card className="border-purple-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Hoje
            </CardTitle>
            <Calendar className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{agendamentosHoje.length}</div>
            <p className="text-xs text-gray-500 mt-1">atendimentos</p>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Esta Semana
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{agendamentosSemana.length}</div>
            <p className="text-xs text-gray-500 mt-1">atendimentos</p>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Este Mês
            </CardTitle>
            <Calendar className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{agendamentosMes.length}</div>
            <p className="text-xs text-gray-500 mt-1">atendimentos</p>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avaliação
            </CardTitle>
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{avaliacaoMedia.toFixed(1)}</div>
            <p className="text-xs text-gray-500 mt-1">de 5.0</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações do Funcionário */}
        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Minhas Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {funcionario.nome_completo?.charAt(0) || 'F'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{funcionario.nome_completo}</p>
                <p className="text-sm text-gray-600">{funcionario.cargo}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500">Tempo de Empresa</p>
                <p className="text-sm font-semibold text-gray-900">
                  {mesesEmpresa} {mesesEmpresa === 1 ? 'mês' : 'meses'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Clientes Atendidos</p>
                <p className="text-sm font-semibold text-gray-900">{clientesUnicos}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total de Atendimentos</p>
                <p className="text-sm font-semibold text-gray-900">{agendamentos.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-semibold text-green-600">{funcionario.status || 'Ativo'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximos Agendamentos */}
        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Próximos Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proximosAgendamentos.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Nenhum agendamento futuro
              </p>
            ) : (
              <div className="space-y-3">
                {proximosAgendamentos.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {agendamento.cliente?.nome_completo || 'Cliente'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {agendamento.servico?.nome || 'Serviço'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-purple-600">
                        {agendamento.hora_inicio}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(agendamento.data + 'T00:00:00'), 'dd/MM', { locale: ptBR })}
                      </p>
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
