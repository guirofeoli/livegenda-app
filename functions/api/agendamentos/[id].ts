// ============================================
// LIVEGENDA - API de Agendamentos (ID)
// ============================================
// GET, PUT, PATCH, DELETE para agendamentos individuais
// Usa SQL direto com @neondatabase/serverless

import type { CloudflareEnv } from '../lib/env';
import { createNeonClient } from '../lib/db';

// Validação de UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// GET /api/agendamentos/:id - Buscar agendamento por ID com dados relacionados
export const onRequestGet: PagesFunction<CloudflareEnv> = async (context) => {
  const id = context.params.id as string;
  
  if (!isValidUUID(id)) {
    return new Response(
      JSON.stringify({ error: true, message: 'ID inválido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const sql = createNeonClient(context.env.DATABASE_URL);
    
    const rows = await sql`
      SELECT 
        a.id, a.empresa_id, a.cliente_id, a.funcionario_id, a.servico_id,
        a.data_hora, a.data_hora_fim, a.status, a.observacoes, a.preco_final, a.criado_em,
        c.nome as cliente_nome, c.telefone as cliente_telefone, c.email as cliente_email,
        f.nome as funcionario_nome, f.cor as funcionario_cor,
        s.nome as servico_nome, s.duracao_minutos as servico_duracao, s.preco as servico_preco
      FROM agendamentos a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN funcionarios f ON a.funcionario_id = f.id
      LEFT JOIN servicos s ON a.servico_id = s.id
      WHERE a.id = ${id}
    `;
    
    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Agendamento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const row = rows[0];
    const result = {
      id: row.id,
      empresa_id: row.empresa_id,
      cliente_id: row.cliente_id,
      funcionario_id: row.funcionario_id,
      servico_id: row.servico_id,
      data_hora: row.data_hora,
      data_hora_fim: row.data_hora_fim,
      status: row.status,
      observacoes: row.observacoes,
      preco_final: row.preco_final,
      criado_em: row.criado_em,
      cliente: row.cliente_nome ? {
        id: row.cliente_id,
        nome: row.cliente_nome,
        telefone: row.cliente_telefone,
        email: row.cliente_email
      } : null,
      funcionario: row.funcionario_nome ? {
        id: row.funcionario_id,
        nome: row.funcionario_nome,
        cor: row.funcionario_cor
      } : null,
      servico: row.servico_nome ? {
        id: row.servico_id,
        nome: row.servico_nome,
        duracao_minutos: row.servico_duracao,
        preco: row.servico_preco
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

// PUT /api/agendamentos/:id - Atualizar agendamento completo
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
    const sql = createNeonClient(context.env.DATABASE_URL);
    
    // Verificar se existe
    const existing = await sql`SELECT id, data_hora FROM agendamentos WHERE id = ${id}`;
    if (existing.length === 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Agendamento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const oldDataHora = existing[0].data_hora;
    const newDataHora = body.data_hora ? new Date(body.data_hora) : null;
    const remarcado = newDataHora && oldDataHora && 
      new Date(oldDataHora).getTime() !== newDataHora.getTime();
    
    // Calcular data_hora_fim se mudou data_hora ou servico
    let dataHoraFim = body.data_hora_fim;
    if (newDataHora && body.servico_id) {
      const servicoRows = await sql`SELECT duracao_minutos FROM servicos WHERE id = ${body.servico_id}`;
      if (servicoRows.length > 0) {
        dataHoraFim = new Date(newDataHora.getTime() + servicoRows[0].duracao_minutos * 60000).toISOString();
      }
    }
    
    // Verificar conflitos se mudou horário ou funcionário
    if (newDataHora || body.funcionario_id) {
      const funcId = body.funcionario_id || existing[0].funcionario_id;
      const dataInicio = newDataHora || new Date(oldDataHora);
      const dataFim = dataHoraFim ? new Date(dataHoraFim) : new Date(dataInicio.getTime() + 60 * 60000);
      
      const conflitos = await sql`
        SELECT id FROM agendamentos 
        WHERE funcionario_id = ${funcId}
          AND id != ${id}
          AND status NOT IN ('cancelado', 'concluido')
          AND (data_hora < ${dataFim.toISOString()} AND data_hora_fim > ${dataInicio.toISOString()})
      `;
      
      if (conflitos.length > 0) {
        return new Response(
          JSON.stringify({ error: true, message: 'Conflito de horário com outro agendamento' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Atualizar
    const updateResult = await sql`
      UPDATE agendamentos SET
        empresa_id = COALESCE(${body.empresa_id}, empresa_id),
        cliente_id = COALESCE(${body.cliente_id}, cliente_id),
        funcionario_id = COALESCE(${body.funcionario_id}, funcionario_id),
        servico_id = COALESCE(${body.servico_id}, servico_id),
        data_hora = COALESCE(${newDataHora?.toISOString()}, data_hora),
        data_hora_fim = COALESCE(${dataHoraFim}, data_hora_fim),
        status = COALESCE(${body.status}, status),
        observacoes = COALESCE(${body.observacoes}, observacoes),
        preco_final = COALESCE(${body.preco_final}, preco_final)
      WHERE id = ${id}
      RETURNING *
    `;
    
    const agendamento = updateResult[0];

    return new Response(JSON.stringify({
      id: agendamento.id,
      empresa_id: agendamento.empresa_id,
      cliente_id: agendamento.cliente_id,
      funcionario_id: agendamento.funcionario_id,
      servico_id: agendamento.servico_id,
      data_hora: agendamento.data_hora,
      data_hora_fim: agendamento.data_hora_fim,
      status: agendamento.status,
      preco_final: agendamento.preco_final,
      criado_em: agendamento.criado_em,
      remarcado
    }), {
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
    const sql = createNeonClient(context.env.DATABASE_URL);
    
    // Verificar se existe
    const existing = await sql`SELECT id, data_hora FROM agendamentos WHERE id = ${id}`;
    if (existing.length === 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Agendamento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const oldDataHora = existing[0].data_hora;
    const newDataHora = body.data_hora ? new Date(body.data_hora) : null;
    const remarcado = newDataHora && oldDataHora && 
      new Date(oldDataHora).getTime() !== newDataHora.getTime();
    
    // Atualizar apenas campos fornecidos
    const updateResult = await sql`
      UPDATE agendamentos SET
        status = COALESCE(${body.status}, status),
        observacoes = COALESCE(${body.observacoes}, observacoes),
        data_hora = COALESCE(${newDataHora?.toISOString()}, data_hora),
        data_hora_fim = COALESCE(${body.data_hora_fim}, data_hora_fim),
        preco_final = COALESCE(${body.preco_final}, preco_final)
      WHERE id = ${id}
      RETURNING *
    `;
    
    const agendamento = updateResult[0];

    return new Response(JSON.stringify({
      id: agendamento.id,
      empresa_id: agendamento.empresa_id,
      data_hora: agendamento.data_hora,
      data_hora_fim: agendamento.data_hora_fim,
      status: agendamento.status,
      preco_final: agendamento.preco_final,
      remarcado
    }), {
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

// DELETE /api/agendamentos/:id - Cancelar agendamento
export const onRequestDelete: PagesFunction<CloudflareEnv> = async (context) => {
  const id = context.params.id as string;
  
  if (!isValidUUID(id)) {
    return new Response(
      JSON.stringify({ error: true, message: 'ID inválido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const sql = createNeonClient(context.env.DATABASE_URL);
    
    // Verificar se existe
    const existing = await sql`SELECT id FROM agendamentos WHERE id = ${id}`;
    if (existing.length === 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Agendamento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Pegar motivo do body se existir
    let observacoes: string | undefined;
    try {
      const body = await context.request.json() as any;
      observacoes = body.motivo || body.motivo_cancelamento;
    } catch {
      // Body vazio é ok
    }
    
    // Cancelar (soft delete via status)
    const updateResult = await sql`
      UPDATE agendamentos SET
        status = 'cancelado',
        observacoes = COALESCE(${observacoes}, observacoes)
      WHERE id = ${id}
      RETURNING id, status
    `;
    
    return new Response(JSON.stringify({
      id: updateResult[0].id,
      status: updateResult[0].status
    }), {
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
