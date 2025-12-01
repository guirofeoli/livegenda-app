// ============================================
// LIVEGENDA - API de Funcionários
// ============================================
// GET e POST para funcionários
// Usa SQL direto com @neondatabase/serverless

import type { CloudflareEnv } from '../lib/env';
import { createNeonClient } from '../lib/db';

// Helper: Converte dias_trabalho para array
function normalizeDiasTrabalho(input: any): string[] | null {
  if (!input) return null;
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    return input.split(',').map(d => d.trim()).filter(d => d.length > 0);
  }
  return null;
}

// GET /api/funcionarios - Listar funcionários
export const onRequestGet: PagesFunction<CloudflareEnv> = async (context) => {
  const url = new URL(context.request.url);
  const empresaId = url.searchParams.get("empresa_id");
  
  if (!empresaId) {
    return new Response(
      JSON.stringify({ error: true, message: "empresa_id obrigatório" }), 
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  
  try {
    const sql = createNeonClient(context.env.DATABASE_URL);
    
    const rows = await sql`
      SELECT * FROM funcionarios 
      WHERE empresa_id = ${empresaId} AND ativo = true
      ORDER BY nome ASC
    `;
    
    return new Response(JSON.stringify(rows), { 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error('Erro ao listar funcionários:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao listar funcionários' }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// POST /api/funcionarios - Criar funcionário
export const onRequestPost: PagesFunction<CloudflareEnv> = async (context) => {
  try {
    const body = await context.request.json() as any;
    const { empresa_id, nome, cargo, telefone, email, cor, foto, dias_trabalho, horario_trabalho_inicio, horario_trabalho_fim } = body;
    
    if (!empresa_id || !nome) {
      return new Response(
        JSON.stringify({ error: true, message: "empresa_id e nome obrigatórios" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sql = createNeonClient(context.env.DATABASE_URL);
    
    // Verificar unicidade global de email
    if (email) {
      const emailExists = await sql`
        SELECT id FROM funcionarios WHERE email = ${email} AND ativo = true
        UNION
        SELECT id FROM clientes WHERE email = ${email} AND ativo = true
      `;
      if (emailExists.length > 0) {
        return new Response(
          JSON.stringify({ error: true, message: "Email já cadastrado no sistema" }), 
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    
    // Verificar unicidade global de telefone
    if (telefone) {
      const telExists = await sql`
        SELECT id FROM funcionarios WHERE telefone = ${telefone} AND ativo = true
        UNION
        SELECT id FROM clientes WHERE telefone = ${telefone} AND ativo = true
      `;
      if (telExists.length > 0) {
        return new Response(
          JSON.stringify({ error: true, message: "Telefone já cadastrado no sistema" }), 
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    
    // Normalizar dias_trabalho para array
    const diasTrabalhoNormalized = normalizeDiasTrabalho(dias_trabalho);
    
    const insertResult = await sql`
      INSERT INTO funcionarios (
        empresa_id, nome, cargo, telefone, email, cor, foto,
        dias_trabalho, horario_trabalho_inicio, horario_trabalho_fim, ativo
      ) VALUES (
        ${empresa_id}, ${nome}, ${cargo || null}, ${telefone || null}, ${email || null},
        ${cor || null}, ${foto || null}, ${diasTrabalhoNormalized}, 
        ${horario_trabalho_inicio || null}, ${horario_trabalho_fim || null}, true
      )
      RETURNING *
    `;
    
    const funcionario = insertResult[0];

    return new Response(JSON.stringify(funcionario), { 
      status: 201, 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error('Erro ao criar funcionário:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao criar funcionário' }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
