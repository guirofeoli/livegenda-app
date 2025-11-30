// ============================================
// LIVEGENDA - API de Empresa (por ID)
// ============================================
// GET, PUT, DELETE para empresa específica

interface Env {
  DATABASE_URL: string;
}

// GET /api/empresas/:id - Buscar empresa por ID
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.data.db as any;
  const { id } = context.params;

  try {
    const result = await db`
      SELECT id, nome, categoria, telefone, email, endereco, logo,
             horario_abertura, horario_fechamento, dias_funcionamento,
             ativo, criado_em
      FROM empresas
      WHERE id = ${id}
      LIMIT 1
    `;

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Empresa não encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(result[0]), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar empresa', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT /api/empresas/:id - Atualizar empresa
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const db = context.data.db as any;
  const { id } = context.params;

  try {
    const body = await context.request.json() as any;

    const result = await db`
      UPDATE empresas SET
        nome = COALESCE(${body.nome}, nome),
        categoria = COALESCE(${body.categoria}, categoria),
        email = COALESCE(${body.email}, email),
        telefone = COALESCE(${body.telefone}, telefone),
        endereco = COALESCE(${body.endereco}, endereco),
        logo = COALESCE(${body.logo}, logo),
        horario_abertura = COALESCE(${body.horario_abertura}, horario_abertura),
        horario_fechamento = COALESCE(${body.horario_fechamento}, horario_fechamento),
        dias_funcionamento = COALESCE(${body.dias_funcionamento}, dias_funcionamento)
      WHERE id = ${id}
      RETURNING id, nome, categoria, telefone, email, endereco, logo,
                horario_abertura, horario_fechamento, dias_funcionamento,
                ativo, criado_em
    `;

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Empresa não encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(result[0]), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao atualizar empresa', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE /api/empresas/:id - Desativar empresa (soft delete)
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const db = context.data.db as any;
  const { id } = context.params;

  try {
    const result = await db`
      UPDATE empresas SET ativo = false
      WHERE id = ${id}
      RETURNING id, nome
    `;

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Empresa não encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ 
      message: 'Empresa desativada com sucesso',
      empresa: result[0]
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao desativar empresa:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao desativar empresa', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
