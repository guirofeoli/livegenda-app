// ============================================
// LIVEGENDA - API de Cliente (por ID)
// ============================================
// GET, PUT, DELETE para cliente específico

import type { Env, ApiContext } from '../_middleware';

// GET /api/clientes/:id - Buscar cliente por ID
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const { id } = context.params;

  try {
    const [cliente] = await db`
      SELECT c.*, 
        (SELECT COUNT(*) FROM agendamentos WHERE cliente_id = c.id) as total_agendamentos,
        (SELECT MAX(data_hora) FROM agendamentos WHERE cliente_id = c.id AND status = 'concluido') as ultimo_atendimento
      FROM clientes c
      WHERE c.id = ${id}
    `;

    if (!cliente) {
      return new Response(
        JSON.stringify({ error: 'Cliente não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(cliente), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar cliente' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT /api/clientes/:id - Atualizar cliente
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const { id } = context.params;

  try {
    const body = await context.request.json();

    const [cliente] = await db`
      UPDATE clientes SET
        nome = COALESCE(${body.nome}, nome),
        email = COALESCE(${body.email}, email),
        telefone = COALESCE(${body.telefone}, telefone),
        data_nascimento = COALESCE(${body.data_nascimento}, data_nascimento),
        observacoes = COALESCE(${body.observacoes}, observacoes),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!cliente) {
      return new Response(
        JSON.stringify({ error: 'Cliente não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(cliente), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao atualizar cliente' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE /api/clientes/:id - Desativar cliente
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const { id } = context.params;

  try {
    const [cliente] = await db`
      UPDATE clientes SET
        ativo = false,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, nome
    `;

    if (!cliente) {
      return new Response(
        JSON.stringify({ error: 'Cliente não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ 
      message: 'Cliente desativado com sucesso',
      cliente 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao desativar cliente:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao desativar cliente' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
