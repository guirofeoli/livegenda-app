// ============================================
// LIVEGENDA - API de Empresa (por ID)
// ============================================
// GET, PUT, DELETE para empresa específica

import type { Env, ApiContext } from '../_middleware';

// GET /api/empresas/:id - Buscar empresa por ID
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const { id } = context.params;

  try {
    const [empresa] = await db`
      SELECT id, nome, slug, email, telefone, endereco, 
             logo_url, cor_primaria, cor_secundaria,
             horario_abertura, horario_fechamento, dias_funcionamento,
             ativa, created_at, updated_at
      FROM empresas
      WHERE id = ${id}
    `;

    if (!empresa) {
      return new Response(
        JSON.stringify({ error: 'Empresa não encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(empresa), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar empresa' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT /api/empresas/:id - Atualizar empresa
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const { id } = context.params;

  try {
    const body = await context.request.json();

    const [empresa] = await db`
      UPDATE empresas SET
        nome = COALESCE(${body.nome}, nome),
        email = COALESCE(${body.email}, email),
        telefone = COALESCE(${body.telefone}, telefone),
        endereco = COALESCE(${body.endereco}, endereco),
        logo_url = COALESCE(${body.logo_url}, logo_url),
        cor_primaria = COALESCE(${body.cor_primaria}, cor_primaria),
        cor_secundaria = COALESCE(${body.cor_secundaria}, cor_secundaria),
        horario_abertura = COALESCE(${body.horario_abertura}, horario_abertura),
        horario_fechamento = COALESCE(${body.horario_fechamento}, horario_fechamento),
        dias_funcionamento = COALESCE(${body.dias_funcionamento}, dias_funcionamento),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!empresa) {
      return new Response(
        JSON.stringify({ error: 'Empresa não encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(empresa), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao atualizar empresa' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE /api/empresas/:id - Desativar empresa (soft delete)
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const { id } = context.params;

  try {
    const [empresa] = await db`
      UPDATE empresas SET
        ativa = false,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, nome
    `;

    if (!empresa) {
      return new Response(
        JSON.stringify({ error: 'Empresa não encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ 
      message: 'Empresa desativada com sucesso',
      empresa 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao desativar empresa:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao desativar empresa' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
