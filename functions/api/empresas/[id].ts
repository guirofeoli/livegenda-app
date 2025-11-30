import { neon } from "@neondatabase/serverless";

interface Env {
  DATABASE_URL: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  const id = context.params.id;
  try {
    const result = await sql`SELECT * FROM empresas WHERE id = ${id}`;
    if (result.length === 0) {
      return new Response(JSON.stringify({ error: "Empresa nao encontrada" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify(result[0]), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Erro ao buscar empresa", details: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  const id = context.params.id;
  try {
    const body = await context.request.json();
    const { nome, tipo, categoria, telefone, email, endereco, cep, logo_url, horario_funcionamento } = body;
    const cat = categoria || tipo;
    
    // Converter horario_funcionamento para JSON string se for objeto
    const horarioJson = horario_funcionamento ? JSON.stringify(horario_funcionamento) : null;
    
    const result = await sql`
      UPDATE empresas SET 
        nome = COALESCE(${nome}, nome), 
        categoria = COALESCE(${cat}, categoria), 
        telefone = COALESCE(${telefone}, telefone), 
        email = COALESCE(${email}, email), 
        endereco = COALESCE(${endereco}, endereco),
        cep = COALESCE(${cep}, cep),
        logo = COALESCE(${logo_url}, logo),
        horario_funcionamento = COALESCE(${horarioJson}::jsonb, horario_funcionamento)
      WHERE id = ${id} 
      RETURNING *
    `;
    
    if (result.length === 0) {
      return new Response(JSON.stringify({ error: "Empresa nao encontrada" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify(result[0]), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Erro ao atualizar empresa", details: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  const id = context.params.id;
  try {
    const result = await sql`UPDATE empresas SET ativo = false WHERE id = ${id} RETURNING id`;
    if (result.length === 0) {
      return new Response(JSON.stringify({ error: "Empresa nao encontrada" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Erro ao desativar empresa", details: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
