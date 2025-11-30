// ============================================
// LIVEGENDA - API de Serviço (por ID)
// ============================================

import type { Env, ApiContext } from '../_middleware';

// GET /api/servicos/:id
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const { id } = context.params;

  try {
    const [servico] = await db`
      SELECT s.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', f.id, 'nome', f.nome, 'foto_url', f.foto_url))
           FROM funcionarios f
           JOIN servicos_funcionarios sf ON f.id = sf.funcionario_id
           WHERE sf.servico_id = s.id AND f.ativo = true),
          '[]'
        ) as funcionarios
      FROM servicos s
      WHERE s.id = ${id}
    `;

    if (!servico) {
      return new Response(
        JSON.stringify({ error: 'Serviço não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(servico), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar serviço:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar serviço' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT /api/servicos/:id
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const { id } = context.params;

  try {
    const body = await context.request.json();

    const [servico] = await db`
      UPDATE servicos SET
        nome = COALESCE(${body.nome}, nome),
        descricao = COALESCE(${body.descricao}, descricao),
        duracao_minutos = COALESCE(${body.duracao_minutos}, duracao_minutos),
        preco = COALESCE(${body.preco}, preco),
        categoria = COALESCE(${body.categoria}, categoria),
        cor = COALESCE(${body.cor}, cor),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!servico) {
      return new Response(
        JSON.stringify({ error: 'Serviço não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar funcionários vinculados se especificado
    if (body.funcionario_ids !== undefined) {
      // Remover vínculos antigos
      await db`DELETE FROM servicos_funcionarios WHERE servico_id = ${id}`;
      
      // Adicionar novos vínculos
      for (const funcId of body.funcionario_ids) {
        await db`
          INSERT INTO servicos_funcionarios (servico_id, funcionario_id)
          VALUES (${id}, ${funcId})
        `;
      }
    }

    return new Response(JSON.stringify(servico), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao atualizar serviço' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE /api/servicos/:id
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const { id } = context.params;

  try {
    const [servico] = await db`
      UPDATE servicos SET
        ativo = false,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, nome
    `;

    if (!servico) {
      return new Response(
        JSON.stringify({ error: 'Serviço não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ 
      message: 'Serviço desativado com sucesso',
      servico 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao desativar serviço:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao desativar serviço' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
