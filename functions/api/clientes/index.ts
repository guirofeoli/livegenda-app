// ============================================
// LIVEGENDA - API de Clientes
// ============================================
// CRUD completo para clientes

import type { Env, ApiContext } from '../_middleware';

// Validação de cliente
function validateCliente(body: any): { valid: boolean; error?: string } {
  if (!body.empresa_id || typeof body.empresa_id !== 'number') {
    return { valid: false, error: 'empresa_id é obrigatório' };
  }
  if (!body.nome || typeof body.nome !== 'string' || body.nome.trim().length < 2) {
    return { valid: false, error: 'Nome é obrigatório (mínimo 2 caracteres)' };
  }
  if (!body.telefone || typeof body.telefone !== 'string' || body.telefone.length < 8) {
    return { valid: false, error: 'Telefone válido é obrigatório' };
  }
  return { valid: true };
}

// GET /api/clientes - Listar clientes da empresa
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const url = new URL(context.request.url);
  
  // Filtros
  const empresaId = url.searchParams.get('empresa_id');
  const search = url.searchParams.get('search');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

  if (!empresaId) {
    return new Response(
      JSON.stringify({ error: true, message: 'empresa_id é obrigatório' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    let clientes;
    
    if (search && search.length >= 2) {
      const searchPattern = `%${search}%`;
      clientes = await db`
        SELECT id, nome, email, telefone, data_nascimento, 
               observacoes, ativo, created_at
        FROM clientes
        WHERE empresa_id = ${parseInt(empresaId)}
          AND ativo = true
          AND (nome ILIKE ${searchPattern} OR telefone ILIKE ${searchPattern})
        ORDER BY nome
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      clientes = await db`
        SELECT id, nome, email, telefone, data_nascimento, 
               observacoes, ativo, created_at
        FROM clientes
        WHERE empresa_id = ${parseInt(empresaId)}
          AND ativo = true
        ORDER BY nome
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    // Contar total
    const [{ count }] = await db`
      SELECT COUNT(*) as count
      FROM clientes
      WHERE empresa_id = ${parseInt(empresaId)} AND ativo = true
    `;

    return new Response(JSON.stringify({
      data: clientes,
      pagination: {
        total: parseInt(count),
        limit,
        offset,
        hasMore: offset + limit < parseInt(count),
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao listar clientes' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/clientes - Criar novo cliente
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;

  try {
    const body = await context.request.json();
    
    // Validação
    const validation = validateCliente(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: true, message: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se telefone já existe na empresa
    const existingPhone = await db`
      SELECT id FROM clientes 
      WHERE empresa_id = ${body.empresa_id} AND telefone = ${body.telefone}
    `;
    
    if (existingPhone.length > 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Já existe um cliente com este telefone' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Inserir cliente
    const [cliente] = await db`
      INSERT INTO clientes (
        empresa_id, nome, email, telefone, data_nascimento, observacoes
      ) VALUES (
        ${body.empresa_id}, ${body.nome.trim()}, ${body.email?.trim() || null},
        ${body.telefone}, ${body.data_nascimento || null},
        ${body.observacoes || null}
      )
      RETURNING id, nome, email, telefone, created_at
    `;

    return new Response(JSON.stringify(cliente), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao criar cliente' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
