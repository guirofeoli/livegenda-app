import { neon } from "@neondatabase/serverless";

interface Env {
  DATABASE_URL: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  try {
    const empresas = await sql`SELECT * FROM empresas WHERE ativo = true ORDER BY nome`;
    return new Response(JSON.stringify(empresas), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Erro ao buscar empresas", details: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  try {
    const body = await context.request.json();
    const { nome, tipo, telefone, email, endereco } = body;
    if (!nome || !tipo) {
      return new Response(JSON.stringify({ error: "Nome e tipo sao obrigatorios" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const result = await sql`INSERT INTO empresas (nome, tipo, telefone, email, endereco, ativo) VALUES (${nome}, ${tipo}, ${telefone || null}, ${email || null}, ${endereco || null}, true) RETURNING *`;
    return new Response(JSON.stringify(result[0]), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Erro ao criar empresa", details: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
