import { neon } from "@neondatabase/serverless";

interface Env {
  DATABASE_URL: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  
  try {
    const body = await context.request.json();
    const { email } = body;
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // 1. Verificar se existe em usuarios
    const usuarios = await sql`
      SELECT u.id, u.nome, u.empresa_id, e.nome as empresa_nome
      FROM usuarios u
      LEFT JOIN empresas e ON u.empresa_id = e.id
      WHERE u.email = ${email} AND u.ativo = true
    `;
    
    if (usuarios.length > 0) {
      const user = usuarios[0];
      return new Response(
        JSON.stringify({
          exists: true,
          type: "usuario",
          hasEmpresa: !!user.empresa_id,
          empresaNome: user.empresa_nome || null,
          nome: user.nome
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // 2. Verificar se existe em funcionarios (sem conta de usuario ainda)
    const funcionarios = await sql`
      SELECT f.id, f.nome, f.empresa_id, e.nome as empresa_nome
      FROM funcionarios f
      JOIN empresas e ON f.empresa_id = e.id
      WHERE f.email = ${email} AND f.ativo = true
    `;
    
    if (funcionarios.length > 0) {
      const func = funcionarios[0];
      return new Response(
        JSON.stringify({
          exists: true,
          type: "funcionario",
          funcionarioId: func.id,
          empresaId: func.empresa_id,
          empresaNome: func.empresa_nome,
          nome: func.nome
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // 3. Email não existe em lugar nenhum
    return new Response(
      JSON.stringify({
        exists: false,
        type: "novo"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro ao verificar email", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
