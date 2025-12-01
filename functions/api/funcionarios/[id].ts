// ============================================
// LIVEGENDA - API de Funcionários (ID)
// ============================================
// GET, PUT, DELETE para funcionários individuais
// Usa SQL direto com @neondatabase/serverless

import type { CloudflareEnv } from '../lib/env';
import { createNeonClient } from '../lib/db';

// Validação de UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Helper: Converte dias_trabalho para array
function normalizeDiasTrabalho(input: any): string[] | null {
  if (!input) return null;
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    return input.split(',').map(d => d.trim()).filter(d => d.length > 0);
  }
  return null;
}

// GET /api/funcionarios/:id
export const onRequestGet: PagesFunction<CloudflareEnv> = async (context) => {
  const id = context.params.id as string;
  
  if (!isValidUUID(id)) {
    return new Response(
      JSON.stringify({ error: true, message: 'ID inválido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const sql = createNeonClient(context.env.DATABASE_URL);
    
    const rows = await sql`SELECT * FROM funcionarios WHERE id = ${id}`;
    
    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Funcionário não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(rows[0]), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar funcionário:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao buscar funcionário' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT /api/funcionarios/:id
export const onRequestPut: PagesFunction<CloudflareEnv> = async (context) => {
  const id = context.params.id as string;
  
  if (!isValidUUID(id)) {
    return new Response(
      JSON.stringify({ error: true, message: 'ID inválido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await context.request.json() as any;
    const sql = createNeonClient(context.env.DATABASE_URL);
    
    // Verificar se existe
    const existing = await sql`SELECT * FROM funcionarios WHERE id = ${id}`;
    if (existing.length === 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Funcionário não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const func = existing[0];
    
    // Verificar unicidade global de email (se mudou)
    if (body.email && body.email !== func.email) {
      const emailExists = await sql`
        SELECT id FROM funcionarios WHERE email = ${body.email} AND id != ${id} AND ativo = true
        UNION
        SELECT id FROM clientes WHERE email = ${body.email} AND ativo = true
      `;
      if (emailExists.length > 0) {
        return new Response(
          JSON.stringify({ error: true, message: 'Email já cadastrado no sistema' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Verificar unicidade global de telefone (se mudou)
    if (body.telefone && body.telefone !== func.telefone) {
      const telExists = await sql`
        SELECT id FROM funcionarios WHERE telefone = ${body.telefone} AND id != ${id} AND ativo = true
        UNION
        SELECT id FROM clientes WHERE telefone = ${body.telefone} AND ativo = true
      `;
      if (telExists.length > 0) {
        return new Response(
          JSON.stringify({ error: true, message: 'Telefone já cadastrado no sistema' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Normalizar dias_trabalho se fornecido
    const diasTrabalho = body.dias_trabalho !== undefined 
      ? normalizeDiasTrabalho(body.dias_trabalho) 
      : func.dias_trabalho;
    
    // Atualizar
    const updateResult = await sql`
      UPDATE funcionarios SET
        nome = COALESCE(${body.nome}, nome),
        cargo = COALESCE(${body.cargo}, cargo),
        telefone = COALESCE(${body.telefone}, telefone),
        email = COALESCE(${body.email}, email),
        cor = COALESCE(${body.cor}, cor),
        foto = COALESCE(${body.foto}, foto),
        dias_trabalho = ${diasTrabalho},
        horario_trabalho_inicio = COALESCE(${body.horario_trabalho_inicio}, horario_trabalho_inicio),
        horario_trabalho_fim = COALESCE(${body.horario_trabalho_fim}, horario_trabalho_fim),
        ativo = COALESCE(${body.ativo}, ativo)
      WHERE id = ${id}
      RETURNING *
    `;
    
    return new Response(JSON.stringify(updateResult[0]), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao atualizar funcionário' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE /api/funcionarios/:id (soft delete - desativar)
export const onRequestDelete: PagesFunction<CloudflareEnv> = async (context) => {
  const id = context.params.id as string;
  
  if (!isValidUUID(id)) {
    return new Response(
      JSON.stringify({ error: true, message: 'ID inválido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const sql = createNeonClient(context.env.DATABASE_URL);
    
    // Verificar se existe
    const existing = await sql`SELECT id FROM funcionarios WHERE id = ${id}`;
    if (existing.length === 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Funcionário não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Desativar (soft delete)
    await sql`UPDATE funcionarios SET ativo = false WHERE id = ${id}`;

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao desativar funcionário:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao desativar funcionário' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
