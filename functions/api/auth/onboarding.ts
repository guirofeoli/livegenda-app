// ============================================
// LIVEGENDA - Onboarding Endpoint
// ============================================
// Cria nova empresa + usuário admin
// Com logs detalhados para debugging

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
  endereco?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const db = context.data.db as any;
  const isPreview = env.ENVIRONMENT !== 'production';

  // Log helper - só loga em preview/dev
  const log = (step: string, data?: any) => {
    if (isPreview) {
      console.log(`[ONBOARDING] ${step}`, data ? JSON.stringify(data) : '');
    }
  };

  try {
    log('Iniciando onboarding');

    // Verificar se db está disponível
    if (!db) {
      console.error('[ONBOARDING] ERRO: Database não inicializado');
      return new Response(
        JSON.stringify({ error: true, message: 'Erro de configuração do servidor' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json() as OnboardingBody;
    log('Body recebido', { 
      nome: body.nome, 
      email: body.email, 
      nomeNegocio: body.nomeNegocio,
      categoria: body.categoria,
      telefone: body.telefone
    });

    const { nome, email, senha, nomeNegocio, categoria, telefone, emailNegocio, endereco } = body;

    // Validações
    if (!nome || !email || !senha || !nomeNegocio || !categoria || !telefone) {
      log('Validação falhou - campos obrigatórios');
      return new Response(
        JSON.stringify({ error: true, message: 'Todos os campos são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar categoria
    const categoriasValidas = [
      'salao_beleza', 'barbearia', 'clinica_estetica', 
      'spa', 'studio_unhas', 'sobrancelhas', 
      'makeup', 'massagem', 'outro'
    ];
    if (!categoriasValidas.includes(categoria)) {
      log('Categoria inválida', { categoria, validas: categoriasValidas });
      return new Response(
        JSON.stringify({ error: true, message: `Categoria inválida: ${categoria}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailLower = email.toLowerCase().trim();
    log('Email normalizado', { emailLower });

    // Verificar se email já existe
    log('Verificando email existente');
    let existingUser;
    try {
      existingUser = await db`
        SELECT id FROM usuarios WHERE LOWER(email) = ${emailLower} LIMIT 1
      `;
      log('Resultado busca email', { encontrado: existingUser.length > 0 });
    } catch (dbError) {
      console.error('[ONBOARDING] Erro ao verificar email:', dbError);
      return new Response(
        JSON.stringify({ error: true, message: 'Erro ao verificar email' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (existingUser.length > 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Email já cadastrado' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Criar empresa
    log('Criando empresa', { nomeNegocio, categoria });
    let empresa;
    try {
      const empresaResult = await db`
        INSERT INTO empresas (nome, categoria, telefone, email, endereco, ativo)
        VALUES (${nomeNegocio}, ${categoria}, ${telefone}, ${emailNegocio || emailLower}, ${endereco || null}, true)
        RETURNING id, nome, categoria, telefone, email, endereco, logo, ativo, criado_em
      `;
      empresa = empresaResult[0];
      log('Empresa criada', { empresaId: empresa.id });
    } catch (empresaError) {
      console.error('[ONBOARDING] Erro ao criar empresa:', empresaError);
      return new Response(
        JSON.stringify({ 
          error: true, 
          message: 'Erro ao criar empresa',
          detail: isPreview ? String(empresaError) : undefined
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Criar usuário admin
    log('Criando usuário', { nome, email: emailLower, empresaId: empresa.id });
    let usuario;
    try {
      const usuarioResult = await db`
        INSERT INTO usuarios (nome, email, senha, empresa_id, role, ativo)
        VALUES (${nome}, ${emailLower}, ${senha}, ${empresa.id}, 'admin', true)
        RETURNING id, nome, email, empresa_id, role, ativo, criado_em
      `;
      usuario = usuarioResult[0];
      log('Usuário criado', { usuarioId: usuario.id });
    } catch (usuarioError) {
      console.error('[ONBOARDING] Erro ao criar usuário:', usuarioError);
      // Tentar reverter a empresa criada
      try {
        await db`DELETE FROM empresas WHERE id = ${empresa.id}`;
        log('Empresa revertida após erro');
      } catch (rollbackError) {
        console.error('[ONBOARDING] Erro ao reverter empresa:', rollbackError);
      }
      return new Response(
        JSON.stringify({ 
          error: true, 
          message: 'Erro ao criar usuário',
          detail: isPreview ? String(usuarioError) : undefined
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    log('Onboarding concluído com sucesso');
    return new Response(
      JSON.stringify({
        success: true,
        usuario,
        empresa
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ONBOARDING] Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: 'Erro ao criar conta',
        detail: isPreview ? String(error) : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
