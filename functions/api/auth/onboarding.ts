import { neon } from "@neondatabase/serverless";

interface Env {
  DATABASE_URL: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  
  try {
    const body = await context.request.json();
    const { 
      // Dados do usuário
      email, 
      senha, 
      nome: nomeUsuario,
      // Dados da empresa
      nomeNegocio,
      categoria,
      telefone,
      endereco,
      horarioFuncionamento,
      intervaloAgendamento,
      lembreteAutomatico,
      tempoAntecedenciaLembrete
    } = body;
    
    // Validações
    if (!email || !senha || !nomeNegocio || !categoria) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: email, senha, nomeNegocio, categoria" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Verificar se email já existe
    const existente = await sql`SELECT id FROM usuarios WHERE email = ${email}`;
    if (existente.length > 0) {
      return new Response(
        JSON.stringify({ error: "Email já cadastrado" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Criar empresa primeiro
    const empresaResult = await sql`
      INSERT INTO empresas (nome, tipo, telefone, email, endereco, ativo)
      VALUES (${nomeNegocio}, ${categoria}, ${telefone || null}, ${email}, ${endereco || null}, true)
      RETURNING *
    `;
    const empresa = empresaResult[0];
    
    // Criar usuário admin vinculado à empresa
    const usuarioResult = await sql`
      INSERT INTO usuarios (email, senha, nome, empresa_id, role, ativo)
      VALUES (${email}, ${senha}, ${nomeUsuario || nomeNegocio}, ${empresa.id}, 'admin', true)
      RETURNING id, email, nome, empresa_id, role, ativo, criado_em
    `;
    const usuario = usuarioResult[0];
    
    return new Response(
      JSON.stringify({
        success: true,
        usuario: usuario,
        empresa: empresa
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro ao fazer onboarding", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
