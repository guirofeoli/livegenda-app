// ============================================
// LIVEGENDA - API de Funcionário (por ID)
// ============================================

import type { Env, ApiContext } from '../_middleware';

// GET /api/funcionarios/:id
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const { id } = context.params;

  try {
    const [funcionario] = await db`
      SELECT f.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', s.id, 'nome', s.nome, 'preco', s.preco))
           FROM servicos s
           JOIN servicos_funcionarios sf ON s.id = sf.servico_id
           WHERE sf.funcionario_id = f.id),
          '[]'
        ) as servicos
      FROM funcionarios f
      WHERE f.id = ${id}
    `;

    if (!funcionario) {
      return new Response(
        JSON.stringify({ error: 'Funcionário não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(funcionario), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar funcionário:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar funcionário' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT /api/funcionarios/:id
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const { id } = context.params;

  try {
    const body = await context.request.json();

    const [funcionario] = await db`
      UPDATE funcionarios SET
        nome = COALESCE(${body.nome}, nome),
        email = COALESCE(${body.email}, email),
        telefone = COALESCE(${body.telefone}, telefone),
        cargo = COALESCE(${body.cargo}, cargo),
        especialidades = COALESCE(${body.especialidades}, especialidades),
        horario_trabalho = COALESCE(${body.horario_trabalho}, horario_trabalho),
        dias_trabalho = COALESCE(${body.dias_trabalho}, dias_trabalho),
        cor_agenda = COALESCE(${body.cor_agenda}, cor_agenda),
        foto_url = COALESCE(${body.foto_url}, foto_url),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!funcionario) {
      return new Response(
        JSON.stringify({ error: 'Funcionário não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(funcionario), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao atualizar funcionário' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE /api/funcionarios/:id
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const { id } = context.params;

  try {
    const [funcionario] = await db`
      UPDATE funcionarios SET
        ativo = false,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, nome
    `;

    if (!funcionario) {
      return new Response(
        JSON.stringify({ error: 'Funcionário não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ 
      message: 'Funcionário desativado com sucesso',
      funcionario 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao desativar funcionário:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao desativar funcionário' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
