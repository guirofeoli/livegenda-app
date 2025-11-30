import { neon } from "@neondatabase/serverless";
interface Env { DATABASE_URL: string; }

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  const id = context.params.id as string;
  
  try {
    const result = await sql`SELECT * FROM servicos WHERE id = ${id} AND ativo = true`;
    if (result.length === 0) {
      return new Response(JSON.stringify({ error: "Servico nao encontrado" }), { 
        status: 404, 
        headers: { "Content-Type": "application/json" } 
      });
    }
    return new Response(JSON.stringify(result[0]), { 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  const id = context.params.id as string;
  
  try {
    const body = await context.request.json();
    const { nome, descricao, duracao_minutos, preco } = body;
    
    const result = await sql`
      UPDATE servicos 
      SET 
        nome = COALESCE(${nome || null}, nome),
        descricao = COALESCE(${descricao || null}, descricao),
        duracao_minutos = COALESCE(${duracao_minutos || null}, duracao_minutos),
        preco = COALESCE(${preco || null}, preco)
      WHERE id = ${id} AND ativo = true
      RETURNING *
    `;
    
    if (result.length === 0) {
      return new Response(JSON.stringify({ error: "Servico nao encontrado" }), { 
        status: 404, 
        headers: { "Content-Type": "application/json" } 
      });
    }
    
    return new Response(JSON.stringify(result[0]), { 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const sql = neon(context.env.DATABASE_URL);
  const id = context.params.id as string;
  
  try {
    const result = await sql`
      UPDATE servicos 
      SET ativo = false 
      WHERE id = ${id} 
      RETURNING *
    `;
    
    if (result.length === 0) {
      return new Response(JSON.stringify({ error: "Servico nao encontrado" }), { 
        status: 404, 
        headers: { "Content-Type": "application/json" } 
      });
    }
    
    return new Response(JSON.stringify({ success: true }), { 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
};
