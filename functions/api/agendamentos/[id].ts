// ============================================
// LIVEGENDA - API de Agendamentos (ID)
// ============================================
// GET, PUT, PATCH, DELETE para agendamentos individuais
// Usa módulos compartilhados para paridade com Express

import type { CloudflareEnv } from '../lib/env';
import { createDbClient } from '../lib/db';
import { toEnvConfig } from '../lib/env';
import { createAgendamentoUseCase } from '../../../shared/lib/use-cases/agendamentos';

// Validação de UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// GET /api/agendamentos/:id - Buscar agendamento por ID
export const onRequestGet: PagesFunction<CloudflareEnv> = async (context) => {
  const id = context.params.id as string;
  
  if (!isValidUUID(id)) {
    return new Response(
      JSON.stringify({ error: true, message: 'ID inválido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const dbClient = createDbClient(context.env.DATABASE_URL);
    const envConfig = toEnvConfig(context.env);
    const useCase = createAgendamentoUseCase({ db: dbClient, env: envConfig });
    
    const agendamento = await useCase.buscarPorId(id);
    
    if (!agendamento) {
      return new Response(
        JSON.stringify({ error: true, message: 'Agendamento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transformar para snake_case
    const result = {
      id: agendamento.id,
      empresa_id: agendamento.empresaId,
      cliente_id: agendamento.clienteId,
      funcionario_id: agendamento.funcionarioId,
      servico_id: agendamento.servicoId,
      data_hora: agendamento.dataHora,
      data_hora_fim: agendamento.dataHoraFim,
      status: agendamento.status,
      observacoes: agendamento.observacoes,
      preco_final: agendamento.precoFinal,
      criado_em: agendamento.criadoEm,
      cliente: agendamento.cliente ? {
        id: agendamento.cliente.id,
        nome: agendamento.cliente.nome,
        telefone: agendamento.cliente.telefone,
        email: agendamento.cliente.email
      } : null,
      funcionario: agendamento.funcionario ? {
        id: agendamento.funcionario.id,
        nome: agendamento.funcionario.nome,
        cor: agendamento.funcionario.cor
      } : null,
      servico: agendamento.servico ? {
        id: agendamento.servico.id,
        nome: agendamento.servico.nome,
        duracao_minutos: agendamento.servico.duracaoMinutos,
        preco: agendamento.servico.preco
      } : null
    };

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao buscar agendamento' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT /api/agendamentos/:id - Atualizar agendamento completo (com notificação de remarcação)
export const onRequestPut: PagesFunction<CloudflareEnv> = async (context) => {
  const id = context.params.id as string;
  
  if (!isValidUUID(id)) {
    return new Response(
      JSON.stringify({ error: true, message: 'ID inválido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await context.request.json() as any;
    
    const dbClient = createDbClient(context.env.DATABASE_URL);
    const envConfig = toEnvConfig(context.env);
    const useCase = createAgendamentoUseCase({ db: dbClient, env: envConfig });
    
    // Converter snake_case para camelCase
    const updateData: any = {};
    if (body.empresa_id) updateData.empresaId = body.empresa_id;
    if (body.cliente_id) updateData.clienteId = body.cliente_id;
    if (body.funcionario_id) updateData.funcionarioId = body.funcionario_id;
    if (body.servico_id) updateData.servicoId = body.servico_id;
    if (body.data_hora) updateData.dataHora = new Date(body.data_hora);
    if (body.data_hora_fim) updateData.dataHoraFim = new Date(body.data_hora_fim);
    if (body.status) updateData.status = body.status;
    if (body.observacoes !== undefined) updateData.observacoes = body.observacoes;
    if (body.preco_final !== undefined) updateData.precoFinal = body.preco_final;
    
    const result = await useCase.atualizar(id, updateData);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: true, message: result.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
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
      remarcado: result.remarcado,
      notificacoes: result.notificacoes
    };

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao atualizar agendamento' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PATCH /api/agendamentos/:id - Atualizar parcialmente (status, observações, etc)
export const onRequestPatch: PagesFunction<CloudflareEnv> = async (context) => {
  const id = context.params.id as string;
  
  if (!isValidUUID(id)) {
    return new Response(
      JSON.stringify({ error: true, message: 'ID inválido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await context.request.json() as any;
    
    const dbClient = createDbClient(context.env.DATABASE_URL);
    const envConfig = toEnvConfig(context.env);
    const useCase = createAgendamentoUseCase({ db: dbClient, env: envConfig });
    
    // Converter snake_case para camelCase
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.observacoes !== undefined) updateData.observacoes = body.observacoes;
    if (body.data_hora) updateData.dataHora = new Date(body.data_hora);
    if (body.data_hora_fim) updateData.dataHoraFim = new Date(body.data_hora_fim);
    if (body.preco_final !== undefined) updateData.precoFinal = body.preco_final;
    
    const result = await useCase.atualizar(id, updateData);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: true, message: result.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transformar resposta para snake_case
    const agendamento = result.agendamento;
    const response = {
      id: agendamento?.id,
      empresa_id: agendamento?.empresaId,
      data_hora: agendamento?.dataHora,
      data_hora_fim: agendamento?.dataHoraFim,
      status: agendamento?.status,
      preco_final: agendamento?.precoFinal,
      remarcado: result.remarcado,
      notificacoes: result.notificacoes
    };

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao atualizar agendamento' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE /api/agendamentos/:id - Cancelar agendamento (com notificação)
export const onRequestDelete: PagesFunction<CloudflareEnv> = async (context) => {
  const id = context.params.id as string;
  
  if (!isValidUUID(id)) {
    return new Response(
      JSON.stringify({ error: true, message: 'ID inválido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const dbClient = createDbClient(context.env.DATABASE_URL);
    const envConfig = toEnvConfig(context.env);
    const useCase = createAgendamentoUseCase({ db: dbClient, env: envConfig });
    
    // Pegar motivo do body se existir
    let motivo: string | undefined;
    try {
      const body = await context.request.json() as any;
      motivo = body.motivo || body.motivo_cancelamento;
    } catch {
      // Body vazio é ok
    }
    
    const result = await useCase.cancelar(id, motivo);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: true, message: result.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transformar resposta para snake_case
    const agendamento = result.agendamento;
    const response = {
      id: agendamento?.id,
      status: agendamento?.status,
      notificacoes: result.notificacoes
    };

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao cancelar agendamento' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
