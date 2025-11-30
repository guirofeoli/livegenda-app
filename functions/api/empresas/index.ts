// ============================================
// LIVEGENDA - API de Empresas
// ============================================
// CRUD para empresas (tenants)

interface Env {
  DATABASE_URL: string;
}

// GET /api/empresas - Listar empresas
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.data.db as any;

  try {
    const empresas = await db`
      SELECT id, nome, categoria, telefone, email, endereco, logo,
             horario_abertura, horario_fechamento, dias_funcionamento,
             ativo, criado_em
      FROM empresas
      WHERE ativo = true
      ORDER BY nome
      LIMIT 100
    `;

    return new Response(JSON.stringify(empresas), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao listar empresas', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/empresas - Criar nova empresa
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.data.db as any;

  try {
    const body = await context.request.json() as any;
    
    if (!body.nome || !body.categoria) {
      return new Response(
        JSON.stringify({ error: 'Nome e categoria são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await db`
      INSERT INTO empresas (
        nome, categoria, email, telefone, endereco,
        horario_abertura, horario_fechamento, dias_funcionamento
      ) VALUES (
        ${body.nome.trim()}, 
        ${body.categoria},
        ${body.email || null}, 
        ${body.telefone || null}, 
        ${body.endereco || null},
        ${body.horario_abertura || '08:00'}, 
        ${body.horario_fechamento || '18:00'},
        ${body.dias_funcionamento || ['seg', 'ter', 'qua', 'qui', 'sex']}
      )
      RETURNING id, nome, categoria, email, criado_em
    `;

    return new Response(JSON.stringify(result[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao criar empresa', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
