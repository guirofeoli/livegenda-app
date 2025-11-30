// ============================================
// LIVEGENDA - API de Agendamentos
// ============================================
// CRUD completo para agendamentos

import type { Env } from '../_middleware';

// Validação de UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

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
  
  // Validar formato de data
  const date = new Date(body.data_hora);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'data_hora inválida' };
  }
  
  return { valid: true };
}

// GET /api/agendamentos - Listar agendamentos
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = (context as any).data.db;
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
    // Query com dados relacionados
    let agendamentos = await db`
      SELECT 
        a.id, a.empresa_id, a.cliente_id, a.funcionario_id, a.servico_id,
        a.data_hora, a.data_hora_fim, a.status, a.observacoes, a.preco_final, a.criado_em,
        c.id as c_id, c.nome as c_nome, c.telefone as c_telefone,
        f.id as f_id, f.nome as f_nome, f.cor as f_cor,
        s.id as s_id, s.nome as s_nome, s.duracao_minutos as s_duracao, s.preco as s_preco
      FROM agendamentos a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN funcionarios f ON a.funcionario_id = f.id
      LEFT JOIN servicos s ON a.servico_id = s.id
      WHERE a.empresa_id = ${empresaId}
      ORDER BY a.data_hora DESC
      LIMIT 500
    `;
    
    // Transformar resultado para formato esperado
    agendamentos = agendamentos.map((a: any) => ({
      id: a.id,
      empresa_id: a.empresa_id,
      cliente_id: a.cliente_id,
      funcionario_id: a.funcionario_id,
      servico_id: a.servico_id,
      data_hora: a.data_hora,
      data_hora_fim: a.data_hora_fim,
      status: a.status,
      observacoes: a.observacoes,
      preco_final: a.preco_final,
      criado_em: a.criado_em,
      cliente: a.c_id ? { id: a.c_id, nome: a.c_nome, telefone: a.c_telefone } : null,
      funcionario: a.f_id ? { id: a.f_id, nome: a.f_nome, cor: a.f_cor } : null,
      servico: a.s_id ? { id: a.s_id, nome: a.s_nome, duracao_minutos: a.s_duracao, preco: a.s_preco } : null
    }));

    // Aplicar filtros em memória (mais simples que SQL dinâmico)
    if (funcionarioId) {
      agendamentos = agendamentos.filter((a: any) => a.funcionario_id === funcionarioId);
    }
    if (clienteId) {
      agendamentos = agendamentos.filter((a: any) => a.cliente_id === clienteId);
    }
    if (status) {
      agendamentos = agendamentos.filter((a: any) => a.status === status);
    }
    if (dataInicio) {
      agendamentos = agendamentos.filter((a: any) => new Date(a.data_hora) >= new Date(dataInicio));
    }
    if (dataFim) {
      agendamentos = agendamentos.filter((a: any) => new Date(a.data_hora) <= new Date(dataFim));
    }

    return new Response(JSON.stringify(agendamentos), {
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
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = (context as any).data.db;

  try {
    const body = await context.request.json();
    
    // Validação
    const validation = validateAgendamento(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: true, message: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar duração do serviço
    const servicoInfo = await db`
      SELECT duracao_minutos, preco FROM servicos WHERE id = ${body.servico_id}
    `;
    
    if (servicoInfo.length === 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Serviço não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const duracao = servicoInfo[0].duracao_minutos;
    const dataHoraInicio = new Date(body.data_hora);
    const dataHoraFim = new Date(dataHoraInicio.getTime() + duracao * 60000);

    // Verificar conflito de horário
    const conflitos = await db`
      SELECT id FROM agendamentos
      WHERE funcionario_id = ${body.funcionario_id}
        AND status NOT IN ('cancelado', 'nao_compareceu')
        AND (
          (data_hora <= ${dataHoraInicio.toISOString()} AND data_hora_fim > ${dataHoraInicio.toISOString()})
          OR (data_hora < ${dataHoraFim.toISOString()} AND data_hora_fim >= ${dataHoraFim.toISOString()})
          OR (data_hora >= ${dataHoraInicio.toISOString()} AND data_hora_fim <= ${dataHoraFim.toISOString()})
        )
    `;

    if (conflitos.length > 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Horário indisponível - já existe agendamento neste período' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Inserir agendamento
    const [agendamento] = await db`
      INSERT INTO agendamentos (
        empresa_id, cliente_id, funcionario_id, servico_id,
        data_hora, data_hora_fim, status, preco_final, observacoes
      ) VALUES (
        ${body.empresa_id}, ${body.cliente_id}, ${body.funcionario_id},
        ${body.servico_id}, ${dataHoraInicio.toISOString()}, 
        ${dataHoraFim.toISOString()}, ${body.status || 'pendente'},
        ${body.preco_final || servicoInfo[0].preco || null}, ${body.observacoes || null}
      )
      RETURNING id, data_hora, data_hora_fim, status, criado_em
    `;

    return new Response(JSON.stringify(agendamento), {
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
