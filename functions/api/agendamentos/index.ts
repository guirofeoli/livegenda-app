// ============================================
// LIVEGENDA - API de Agendamentos
// ============================================
// GET e POST para lista de agendamentos
// Usa SQL direto com @neondatabase/serverless

import type { CloudflareEnv } from '../lib/env';
import { createNeonClient, toCamelCase, rowsToCamelCase } from '../lib/db';

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

// GET /api/agendamentos - Listar agendamentos com dados relacionados
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
    const sql = createNeonClient(context.env.DATABASE_URL);
    
    // Build dynamic query with filters
    let query = `
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
      WHERE a.empresa_id = $1
    `;
    
    const params: any[] = [empresaId];
    let paramIndex = 2;
    
    if (funcionarioId) {
      query += ` AND a.funcionario_id = $${paramIndex}`;
      params.push(funcionarioId);
      paramIndex++;
    }
    
    if (clienteId) {
      query += ` AND a.cliente_id = $${paramIndex}`;
      params.push(clienteId);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (dataInicio) {
      query += ` AND a.data_hora >= $${paramIndex}`;
      params.push(dataInicio);
      paramIndex++;
    }
    
    if (dataFim) {
      query += ` AND a.data_hora <= $${paramIndex}`;
      params.push(dataFim);
      paramIndex++;
    }
    
    query += ` ORDER BY a.data_hora ASC`;
    
    const rows = await sql(query, params);
    
    // Transform to expected format with nested objects
    const result = rows.map((row: any) => ({
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

// POST /api/agendamentos - Criar novo agendamento
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

    const sql = createNeonClient(context.env.DATABASE_URL);
    
    // Buscar duração do serviço
    const servicoRows = await sql`
      SELECT id, duracao_minutos, preco FROM servicos WHERE id = ${body.servico_id}
    `;
    
    if (servicoRows.length === 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Serviço não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const servico = servicoRows[0];
    const dataHoraInicio = new Date(body.data_hora);
    const dataHoraFim = new Date(dataHoraInicio.getTime() + servico.duracao_minutos * 60000);

    // Verificar conflitos de horário
    const conflitos = await sql`
      SELECT id FROM agendamentos 
      WHERE funcionario_id = ${body.funcionario_id}
        AND status NOT IN ('cancelado', 'concluido')
        AND (
          (data_hora < ${dataHoraFim.toISOString()} AND data_hora_fim > ${dataHoraInicio.toISOString()})
        )
    `;
    
    if (conflitos.length > 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Conflito de horário com outro agendamento' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Criar agendamento
    const precoFinal = body.preco_final ?? servico.preco ?? null;
    const statusAgendamento = body.status || 'agendado';
    
    const insertResult = await sql`
      INSERT INTO agendamentos (
        empresa_id, cliente_id, funcionario_id, servico_id,
        data_hora, data_hora_fim, status, preco_final, observacoes
      ) VALUES (
        ${body.empresa_id}, ${body.cliente_id}, ${body.funcionario_id}, ${body.servico_id},
        ${dataHoraInicio.toISOString()}, ${dataHoraFim.toISOString()}, 
        ${statusAgendamento}, ${precoFinal}, ${body.observacoes || null}
      )
      RETURNING *
    `;
    
    const agendamento = insertResult[0];

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
      observacoes: agendamento.observacoes,
      criado_em: agendamento.criado_em
    }), {
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
