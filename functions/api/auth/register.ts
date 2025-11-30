import { neon } from "@neondatabase/serverless";

interface Env {
  DATABASE_URL: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  
  try {
    const body = await context.request.json();
    const { email, senha, nome } = body;
    
    if (!email || !senha || !nome) {
      return new Response(
        JSON.stringify({ error: "Email, senha e nome são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Verificar se email já existe
    const existente = await sql`
      SELECT id FROM usuarios WHERE email = ${email}
    `;
    
    if (existente.length > 0) {
      return new Response(
        JSON.stringify({ error: "Email já cadastrado" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Criar usuário (empresa_id pode ser NULL agora)
    const result = await sql`
      INSERT INTO usuarios (email, senha, nome, empresa_id, role, ativo)
      VALUES (${email}, ${senha}, ${nome}, NULL, 'admin', true)
      RETURNING id, email, nome, empresa_id, role, ativo, criado_em
    `;
    
    return new Response(
      JSON.stringify({
        success: true,
        usuario: result[0]
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro ao registrar usuário", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
