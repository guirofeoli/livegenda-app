// ============================================
// LIVEGENDA - Onboarding Endpoint
// ============================================
// Cria nova empresa + usuário admin
// v2.0 - Seta onboarding_concluido = true

interface Env {
  DATABASE_URL: string;
  ENVIRONMENT: string;
  API_VERSION: string;
  CORS_ORIGIN: string;
}

interface OnboardingBody {
  nome: string;
  email: string;
  senha: string;
  nomeNegocio: string;
  categoria: string;
  telefone: string;
  emailNegocio?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const db = context.data.db as any;

  try {
    const body = await request.json() as OnboardingBody;
    const { nome, email, senha, nomeNegocio, categoria, telefone, emailNegocio } = body;

    // Validações
    if (!nome || !email || !senha || !nomeNegocio || !categoria || !telefone) {
      return new Response(
        JSON.stringify({ error: true, message: 'Todos os campos são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Verificar se email já existe
    const existingUser = await db`
      SELECT id FROM usuarios WHERE LOWER(email) = ${emailLower} LIMIT 1
    `;

    if (existingUser.length > 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Email já cadastrado' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Criar empresa
    const empresaResult = await db`
      INSERT INTO empresas (nome, categoria, telefone, email, ativo)
      VALUES (${nomeNegocio}, ${categoria}, ${telefone}, ${emailNegocio || emailLower}, true)
      RETURNING id, nome, categoria, telefone, email, endereco, logo, ativo, criado_em
    `;

    const empresa = empresaResult[0];

    // Criar usuário admin com onboarding concluído
    const usuarioResult = await db`
      INSERT INTO usuarios (nome, email, senha, empresa_id, role, onboarding_concluido, ativo)
      VALUES (${nome}, ${emailLower}, ${senha}, ${empresa.id}, 'admin', true, true)
      RETURNING id, nome, email, empresa_id, role, onboarding_concluido, ativo, criado_em
    `;

    const usuario = usuarioResult[0];

    return new Response(
      JSON.stringify({
        success: true,
        usuario,
        empresa
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Onboarding error:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao criar conta' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
