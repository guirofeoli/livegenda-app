import { neon } from "@neondatabase/serverless";

interface Env {
  DATABASE_URL: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  const id = context.params.id;
  try {
    const result = await sql`SELECT id, nome, email, empresa_id, role, ativo, criado_em FROM usuarios WHERE id = ${id}`;
    if (result.length === 0) {
      return new Response(JSON.stringify({ error: "Usuario nao encontrado" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify(result[0]), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Erro ao buscar usuario", details: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  const id = context.params.id;
  try {
    const body = await context.request.json();
    const { nome, email } = body;
    const result = await sql`UPDATE usuarios SET nome = COALESCE(${nome}, nome), email = COALESCE(${email}, email) WHERE id = ${id} RETURNING id, nome, email, empresa_id, role, ativo, criado_em`;
    if (result.length === 0) {
      return new Response(JSON.stringify({ error: "Usuario nao encontrado" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify(result[0]), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Erro ao atualizar usuario", details: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
