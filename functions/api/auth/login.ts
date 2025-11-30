// ============================================
// LIVEGENDA - Login Endpoint
// ============================================
// Autentica usuário existente

import { ApiContext } from '../_middleware';

interface Env {
  DATABASE_URL: string;
  ENVIRONMENT: string;
  API_VERSION: string;
  CORS_ORIGIN: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;

  try {
    const body = await request.json() as { email?: string; senha?: string };
    const { email, senha } = body;

    if (!email || !senha) {
      return new Response(
        JSON.stringify({ error: true, message: 'Email e senha são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Buscar usuário
    const result = await db`
      SELECT u.id, u.nome, u.email, u.senha, u.empresa_id, u.role, u.ativo,
             e.nome as empresa_nome, e.categoria as empresa_categoria
      FROM usuarios u
      LEFT JOIN empresas e ON u.empresa_id = e.id
      WHERE LOWER(u.email) = ${emailLower}
      LIMIT 1
    `;

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Email não encontrado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const usuario = result[0];

    if (!usuario.ativo) {
      return new Response(
        JSON.stringify({ error: true, message: 'Conta desativada' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar senha (em produção usar bcrypt)
    if (usuario.senha !== senha) {
      return new Response(
        JSON.stringify({ error: true, message: 'Senha incorreta' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Retornar dados do usuário (sem a senha)
    return new Response(
      JSON.stringify({
        success: true,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          empresa_id: usuario.empresa_id,
          role: usuario.role,
        },
        empresa: usuario.empresa_id ? {
          id: usuario.empresa_id,
          nome: usuario.empresa_nome,
          categoria: usuario.empresa_categoria,
        } : null
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao fazer login' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
