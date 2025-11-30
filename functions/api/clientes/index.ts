import { neon } from "@neondatabase/serverless";
interface Env { DATABASE_URL: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  const url = new URL(context.request.url);
  const empresaId = url.searchParams.get("empresa_id");
  if (!empresaId) return new Response(JSON.stringify({ error: "empresa_id obrigatorio" }), { status: 400, headers: { "Content-Type": "application/json" } });
  try {
    const clientes = await sql`SELECT * FROM clientes WHERE empresa_id = ${empresaId} AND ativo = true ORDER BY nome`;
    return new Response(JSON.stringify(clientes), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  try {
    const body = await context.request.json();
    const { empresa_id, nome, telefone, email } = body;
    if (!empresa_id || !nome) return new Response(JSON.stringify({ error: "empresa_id e nome obrigatorios" }), { status: 400, headers: { "Content-Type": "application/json" } });
    const result = await sql`INSERT INTO clientes (empresa_id, nome, telefone, email, ativo) VALUES (${empresa_id}, ${nome}, ${telefone || null}, ${email || null}, true) RETURNING *`;
    return new Response(JSON.stringify(result[0]), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
