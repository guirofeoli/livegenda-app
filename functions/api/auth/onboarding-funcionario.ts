// ============================================
// LIVEGENDA - Onboarding Funcionario Endpoint
// ============================================
// Cria conta de usuário para funcionário existente

interface Env {
  DATABASE_URL: string;
  ENVIRONMENT: string;
  API_VERSION: string;
  CORS_ORIGIN: string;
}

interface OnboardingFuncionarioBody {
  nome: string;
  email: string;
  senha: string;
  funcionarioId: string;
  empresaId: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const db = context.data.db as any;

  try {
    const body = await request.json() as OnboardingFuncionarioBody;
    const { nome, email, senha, funcionarioId, empresaId } = body;

    // Validações
    if (!nome || !email || !senha || !funcionarioId || !empresaId) {
      return new Response(
        JSON.stringify({ error: true, message: 'Todos os campos são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Verificar se email já existe em usuarios
    const existingUser = await db`
      SELECT id FROM usuarios WHERE LOWER(email) = ${emailLower} LIMIT 1
    `;

    if (existingUser.length > 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Email já possui conta' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se funcionário existe
    const funcionario = await db`
      SELECT id, nome, empresa_id FROM funcionarios 
      WHERE id = ${funcionarioId} AND empresa_id = ${empresaId} AND ativo = true
      LIMIT 1
    `;

    if (funcionario.length === 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Funcionário não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados da empresa
    const empresa = await db`
      SELECT id, nome, categoria FROM empresas WHERE id = ${empresaId} AND ativo = true LIMIT 1
    `;

    if (empresa.length === 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Empresa não encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Criar usuário funcionário
    const usuarioResult = await db`
      INSERT INTO usuarios (nome, email, senha, empresa_id, role, ativo)
      VALUES (${nome}, ${emailLower}, ${senha}, ${empresaId}, 'funcionario', true)
      RETURNING id, nome, email, empresa_id, role, ativo, criado_em
    `;

    const usuario = usuarioResult[0];

    return new Response(
      JSON.stringify({
        success: true,
        usuario,
        empresa: empresa[0]
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Onboarding funcionario error:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao criar conta' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
