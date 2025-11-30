import { neon } from "@neondatabase/serverless";

interface Env {
  DATABASE_URL: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  
  try {
    const body = await context.request.json();
    const { funcionarioId, empresaId, email, nome, senha } = body;
    
    if (!funcionarioId || !empresaId || !email || !nome || !senha) {
      return new Response(
        JSON.stringify({ error: "Todos os campos são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Verificar se funcionário existe
    const funcResult = await sql`SELECT * FROM funcionarios WHERE id = ${funcionarioId} AND empresa_id = ${empresaId}`;
    if (funcResult.length === 0) {
      return new Response(
        JSON.stringify({ error: "Funcionário não encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Verificar se email já existe em usuarios
    const existingUser = await sql`SELECT id FROM usuarios WHERE email = ${email}`;
    if (existingUser.length > 0) {
      return new Response(
        JSON.stringify({ error: "Email já está em uso" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Criar usuário vinculado à empresa
    const userResult = await sql`
      INSERT INTO usuarios (email, senha, nome, empresa_id, role, ativo)
      VALUES (${email}, ${senha}, ${nome}, ${empresaId}, 'funcionario', true)
      RETURNING id, email, nome, empresa_id, role, ativo, criado_em
    `;
    const usuario = userResult[0];
    
    // Atualizar funcionário com referência ao usuário (se houver campo usuario_id)
    // Opcional: await sql\`UPDATE funcionarios SET usuario_id = \${usuario.id} WHERE id = \${funcionarioId}\`;
    
    // Buscar dados da empresa
    const empresaResult = await sql`SELECT * FROM empresas WHERE id = ${empresaId}`;
    const empresa = empresaResult[0];
    
    return new Response(
      JSON.stringify({
        success: true,
        usuario: usuario,
        empresa: {
          id: empresa.id,
          nome: empresa.nome,
          categoria: empresa.categoria
        }
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro ao criar conta", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
