import { neon } from "@neondatabase/serverless";

interface Env {
  DATABASE_URL: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  
  try {
    const body = await context.request.json();
    const { email, senha } = body;
    
    if (!email || !senha) {
      return new Response(
        JSON.stringify({ error: "Email e senha são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Buscar usuário por email
    const usuarios = await sql`
      SELECT u.*, e.nome as empresa_nome, e.tipo as empresa_tipo
      FROM usuarios u
      LEFT JOIN empresas e ON u.empresa_id = e.id
      WHERE u.email = ${email} AND u.ativo = true
    `;
    
    if (usuarios.length === 0) {
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const usuario = usuarios[0];
    
    // Verificar senha (por enquanto comparação simples - implementar bcrypt depois)
    if (usuario.senha !== senha) {
      return new Response(
        JSON.stringify({ error: "Senha incorreta" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Retornar dados do usuário (sem a senha)
    const { senha: _, ...usuarioSemSenha } = usuario;
    
    return new Response(
      JSON.stringify({
        success: true,
        usuario: usuarioSemSenha,
        empresa: {
          id: usuario.empresa_id,
          nome: usuario.empresa_nome,
          tipo: usuario.empresa_tipo
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro ao fazer login", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// GET para verificar sessão (opcional)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  return new Response(
    JSON.stringify({ message: "Use POST para fazer login" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
