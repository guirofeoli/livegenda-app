// ============================================
// LIVEGENDA - API de Agendamentos
// ============================================
// GET e POST para lista de agendamentos
// Usa módulos compartilhados para paridade com Express

import type { CloudflareEnv } from '../lib/env';
import { createDbClient } from '../lib/db';
import { toEnvConfig } from '../lib/env';
import { createAgendamentoUseCase } from '../../../shared/lib/use-cases/agendamentos';

// Validação de agendamento
function validateAgendamento(body: any): { valid: boolean; error?: string } {
  if (!body.empresa_id || typeof body.empresa_id !== 'string') {
    return { valid: false, error: 'empresa_id é obrigatório' };
  }
  if (!body.cliente_id || typeof body.cliente_id !== 'string') {
    return { valid: false, error: 'cliente_id é obrigatório' };
  }
  if (!body.funcionario_id || typeof body.funcionario_id !== 'string') {
    return { valid: false, error: 'funcionario_id é obrigatório' };
  }
  if (!body.servico_id || typeof body.servico_id !== 'string') {
    return { valid: false, error: 'servico_id é obrigatório' };
  }
  if (!body.data_hora || typeof body.data_hora !== 'string') {
    return { valid: false, error: 'data_hora é obrigatório (formato ISO)' };
  }
  
  const date = new Date(body.data_hora);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'data_hora inválida' };
  }
  
  return { valid: true };
}

// GET /api/agendamentos - Listar agendamentos (via shared modules)
export const onRequestGet: PagesFunction<CloudflareEnv> = async (context) => {
  const url = new URL(context.request.url);
  
  const empresaId = url.searchParams.get('empresa_id');
  const funcionarioId = url.searchParams.get('funcionario_id');
  const clienteId = url.searchParams.get('cliente_id');
  const dataInicio = url.searchParams.get('data_inicio');
  const dataFim = url.searchParams.get('data_fim');
  const status = url.searchParams.get('status');

  if (!empresaId) {
    return new Response(
      JSON.stringify({ error: true, message: 'empresa_id é obrigatório' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const dbClient = createDbClient(context.env.DATABASE_URL);
    const envConfig = toEnvConfig(context.env);
    const useCase = createAgendamentoUseCase({ db: dbClient, env: envConfig });
    
    // Usar método do use-case para listar com dados relacionados
    const agendamentos = await useCase.listarCompletosPorEmpresa(empresaId, {
      funcionarioId: funcionarioId || undefined,
      clienteId: clienteId || undefined,
      status: status || undefined,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
    });

    // Transformar para formato snake_case esperado pelo frontend
    const result = agendamentos.map((a: any) => ({
      id: a.id,
      empresa_id: a.empresaId,
      cliente_id: a.clienteId,
      funcionario_id: a.funcionarioId,
      servico_id: a.servicoId,
      data_hora: a.dataHora,
      data_hora_fim: a.dataHoraFim,
      status: a.status,
      observacoes: a.observacoes,
      preco_final: a.precoFinal,
      criado_em: a.criadoEm,
      cliente: a.cliente ? { 
        id: a.cliente.id, 
        nome: a.cliente.nome, 
        telefone: a.cliente.telefone, 
        email: a.cliente.email 
      } : null,
      funcionario: a.funcionario ? { 
        id: a.funcionario.id, 
        nome: a.funcionario.nome, 
        cor: a.funcionario.cor 
      } : null,
      servico: a.servico ? { 
        id: a.servico.id, 
        nome: a.servico.nome, 
        duracao_minutos: a.servico.duracaoMinutos, 
        preco: a.servico.preco 
      } : null
    }));

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao listar agendamentos' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/agendamentos - Criar novo agendamento (via shared modules com notificações)
export const onRequestPost: PagesFunction<CloudflareEnv> = async (context) => {
  try {
    const body = await context.request.json() as any;
    
    const validation = validateAgendamento(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: true, message: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const dbClient = createDbClient(context.env.DATABASE_URL);
    const envConfig = toEnvConfig(context.env);
    const useCase = createAgendamentoUseCase({ db: dbClient, env: envConfig });
    
    // Buscar duração do serviço via DbClient
    const servico = await dbClient.findServicoById(body.servico_id);
    if (!servico) {
      return new Response(
        JSON.stringify({ error: true, message: 'Serviço não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const dataHoraInicio = new Date(body.data_hora);
    const dataHoraFim = new Date(dataHoraInicio.getTime() + servico.duracaoMinutos * 60000);

    // Usar use-case para criar (inclui validação de conflito e notificações)
    const result = await useCase.criar({
      empresaId: body.empresa_id,
      clienteId: body.cliente_id,
      funcionarioId: body.funcionario_id,
      servicoId: body.servico_id,
      dataHora: dataHoraInicio,
      dataHoraFim: dataHoraFim,
      status: body.status || 'agendado',
      precoFinal: body.preco_final || servico.preco || null,
      observacoes: body.observacoes || null,
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: true, message: result.error }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transformar resposta para snake_case
    const agendamento = result.agendamento;
    const response = {
      id: agendamento?.id,
      empresa_id: agendamento?.empresaId,
      cliente_id: agendamento?.clienteId,
      funcionario_id: agendamento?.funcionarioId,
      servico_id: agendamento?.servicoId,
      data_hora: agendamento?.dataHora,
      data_hora_fim: agendamento?.dataHoraFim,
      status: agendamento?.status,
      preco_final: agendamento?.precoFinal,
      criado_em: agendamento?.criadoEm,
      notificacoes: result.notificacoes
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao criar agendamento' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
