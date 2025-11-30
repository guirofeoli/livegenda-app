// ============================================
// LIVEGENDA - API de Agendamento (por ID)
// ============================================

import type { Env, ApiContext } from '../_middleware';

// GET /api/agendamentos/:id
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const { id } = context.params;

  try {
    const [agendamento] = await db`
      SELECT 
        a.*,
        json_build_object('id', c.id, 'nome', c.nome, 'telefone', c.telefone, 'email', c.email) as cliente,
        json_build_object('id', f.id, 'nome', f.nome, 'cor_agenda', f.cor_agenda, 'telefone', f.telefone) as funcionario,
        json_build_object('id', s.id, 'nome', s.nome, 'duracao_minutos', s.duracao_minutos, 'preco', s.preco, 'categoria', s.categoria) as servico
      FROM agendamentos a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN funcionarios f ON a.funcionario_id = f.id
      LEFT JOIN servicos s ON a.servico_id = s.id
      WHERE a.id = ${id}
    `;

    if (!agendamento) {
      return new Response(
        JSON.stringify({ error: 'Agendamento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(agendamento), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar agendamento' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT /api/agendamentos/:id - Atualizar agendamento
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const { id } = context.params;

  try {
    const body = await context.request.json();

    // Se estiver alterando data/hora, recalcular data_hora_fim
    let dataHoraFim = null;
    if (body.data_hora) {
      // Buscar duração do serviço atual ou novo
      const servicoId = body.servico_id || (await db`SELECT servico_id FROM agendamentos WHERE id = ${id}`)[0]?.servico_id;
      const [servico] = await db`SELECT duracao_minutos FROM servicos WHERE id = ${servicoId}`;
      
      if (servico) {
        const dataHoraInicio = new Date(body.data_hora);
        dataHoraFim = new Date(dataHoraInicio.getTime() + servico.duracao_minutos * 60000).toISOString();
      }
    }

    const [agendamento] = await db`
      UPDATE agendamentos SET
        cliente_id = COALESCE(${body.cliente_id}, cliente_id),
        funcionario_id = COALESCE(${body.funcionario_id}, funcionario_id),
        servico_id = COALESCE(${body.servico_id}, servico_id),
        data_hora = COALESCE(${body.data_hora}, data_hora),
        data_hora_fim = COALESCE(${dataHoraFim}, data_hora_fim),
        status = COALESCE(${body.status}, status),
        valor = COALESCE(${body.valor}, valor),
        observacoes = COALESCE(${body.observacoes}, observacoes),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!agendamento) {
      return new Response(
        JSON.stringify({ error: 'Agendamento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(agendamento), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao atualizar agendamento' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PATCH /api/agendamentos/:id - Atualizar status (atalho)
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const { id } = context.params;

  try {
    const body = await context.request.json();

    if (!body.status) {
      return new Response(
        JSON.stringify({ error: 'status é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const statusValidos = ['agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'nao_compareceu'];
    if (!statusValidos.includes(body.status)) {
      return new Response(
        JSON.stringify({ error: `Status inválido. Use: ${statusValidos.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const [agendamento] = await db`
      UPDATE agendamentos SET
        status = ${body.status},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!agendamento) {
      return new Response(
        JSON.stringify({ error: 'Agendamento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(agendamento), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao atualizar status' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE /api/agendamentos/:id - Cancelar agendamento
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const { id } = context.params;

  try {
    const [agendamento] = await db`
      UPDATE agendamentos SET
        status = 'cancelado',
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, data_hora, status
    `;

    if (!agendamento) {
      return new Response(
        JSON.stringify({ error: 'Agendamento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ 
      message: 'Agendamento cancelado com sucesso',
      agendamento 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao cancelar agendamento' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
