import { neon } from "@neondatabase/serverless";

interface Env {
  DATABASE_URL: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  
  try {
    const body = await context.request.json();
    const { 
      userId,
      nomeNegocio,
      categoria,
      telefone,
      emailNegocio,
      endereco
    } = body;
    
    if (!userId || !nomeNegocio || !categoria) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: userId, nomeNegocio, categoria" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Verificar se usuário existe
    const userResult = await sql`SELECT * FROM usuarios WHERE id = ${userId}`;
    if (userResult.length === 0) {
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const user = userResult[0];
    
    // Verificar se já tem empresa
    if (user.empresa_id) {
      return new Response(
        JSON.stringify({ error: "Usuário já possui uma empresa vinculada" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Usar emailNegocio se fornecido, senão usar email do usuário
    const emailEmpresa = emailNegocio || user.email;
    
    // Criar empresa
    const empresaResult = await sql`
      INSERT INTO empresas (nome, categoria, telefone, email, endereco, ativo)
      VALUES (${nomeNegocio}, ${categoria}, ${telefone || null}, ${emailEmpresa}, ${endereco || null}, true)
      RETURNING *
    `;
    const empresa = empresaResult[0];
    
    // Vincular empresa ao usuário
    await sql`UPDATE usuarios SET empresa_id = ${empresa.id} WHERE id = ${userId}`;
    
    // Buscar usuário atualizado
    const updatedUser = await sql`SELECT id, email, nome, empresa_id, role, ativo, criado_em FROM usuarios WHERE id = ${userId}`;
    
    return new Response(
      JSON.stringify({
        success: true,
        usuario: updatedUser[0],
        empresa: empresa
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro ao vincular empresa", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
