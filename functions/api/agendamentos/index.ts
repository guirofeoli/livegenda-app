import { neon } from "@neondatabase/serverless";
interface Env { DATABASE_URL: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  const url = new URL(context.request.url);
  const empresaId = url.searchParams.get("empresa_id");
  if (!empresaId) return new Response(JSON.stringify({ error: "empresa_id obrigatorio" }), { status: 400, headers: { "Content-Type": "application/json" } });
  try {
    const agendamentos = await sql`SELECT * FROM agendamentos WHERE empresa_id = ${empresaId} ORDER BY data_hora DESC`;
    return new Response(JSON.stringify(agendamentos), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  try {
    const body = await context.request.json();
    const { empresa_id, cliente_id, funcionario_id, servico_id, data_hora, observacoes } = body;
    if (!empresa_id || !cliente_id || !funcionario_id || !servico_id || !data_hora) {
      return new Response(JSON.stringify({ error: "empresa_id, cliente_id, funcionario_id, servico_id e data_hora obrigatorios" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const result = await sql`INSERT INTO agendamentos (empresa_id, cliente_id, funcionario_id, servico_id, data_hora, status, observacoes) VALUES (${empresa_id}, ${cliente_id}, ${funcionario_id}, ${servico_id}, ${data_hora}, 'agendado', ${observacoes || null}) RETURNING *`;
    return new Response(JSON.stringify(result[0]), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
