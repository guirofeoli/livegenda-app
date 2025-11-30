// ============================================
// LIVEGENDA - Check Email Endpoint
// ============================================
// Verifica se email existe e retorna o tipo de fluxo

interface Env {
  DATABASE_URL: string;
  ENVIRONMENT: string;
  API_VERSION: string;
  CORS_ORIGIN: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const db = context.data.db as any;

  try {
    const body = await request.json() as { email?: string };
    const { email } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: true, message: 'Email é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Verificar se existe em usuarios
    const usuarioResult = await db`
      SELECT id, empresa_id FROM usuarios 
      WHERE LOWER(email) = ${emailLower} AND ativo = true
      LIMIT 1
    `;

    if (usuarioResult.length > 0) {
      return new Response(
        JSON.stringify({ type: 'usuario' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se existe em funcionarios
    const funcionarioResult = await db`
      SELECT id, empresa_id FROM funcionarios 
      WHERE LOWER(email) = ${emailLower} AND ativo = true
      LIMIT 1
    `;

    if (funcionarioResult.length > 0) {
      return new Response(
        JSON.stringify({ 
          type: 'funcionario',
          funcionario_id: funcionarioResult[0].id,
          empresa_id: funcionarioResult[0].empresa_id
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Email não existe em nenhuma tabela
    return new Response(
      JSON.stringify({ type: 'novo' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Check email error:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao verificar email' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
