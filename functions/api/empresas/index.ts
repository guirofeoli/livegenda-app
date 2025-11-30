// ============================================
// LIVEGENDA - API de Empresas
// ============================================
// CRUD completo para empresas (tenants)

import type { Env, ApiContext } from '../_middleware';

// Validação básica de empresa
function validateEmpresa(body: any): { valid: boolean; error?: string } {
  if (!body.nome || typeof body.nome !== 'string' || body.nome.trim().length < 2) {
    return { valid: false, error: 'Nome é obrigatório (mínimo 2 caracteres)' };
  }
  if (!body.slug || typeof body.slug !== 'string' || !/^[a-z0-9-]+$/.test(body.slug)) {
    return { valid: false, error: 'Slug é obrigatório (apenas letras minúsculas, números e hífens)' };
  }
  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    return { valid: false, error: 'Email válido é obrigatório' };
  }
  return { valid: true };
}

// GET /api/empresas - Listar empresas
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;

  try {
    const empresas = await db`
      SELECT id, nome, slug, email, telefone, endereco, 
             logo_url, cor_primaria, cor_secundaria,
             horario_abertura, horario_fechamento, dias_funcionamento,
             ativa, created_at, updated_at
      FROM empresas
      WHERE ativa = true
      ORDER BY nome
      LIMIT 100
    `;

    return new Response(JSON.stringify(empresas), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao listar empresas' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/empresas - Criar nova empresa
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;

  try {
    const body = await context.request.json();
    
    // Validação
    const validation = validateEmpresa(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: true, message: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se slug já existe
    const existingSlug = await db`
      SELECT id FROM empresas WHERE slug = ${body.slug}
    `;
    
    if (existingSlug.length > 0) {
      return new Response(
        JSON.stringify({ error: true, message: 'Este slug já está em uso' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Inserir empresa
    const [empresa] = await db`
      INSERT INTO empresas (
        nome, slug, email, telefone, endereco,
        logo_url, cor_primaria, cor_secundaria,
        horario_abertura, horario_fechamento, dias_funcionamento
      ) VALUES (
        ${body.nome.trim()}, ${body.slug.toLowerCase()}, ${body.email.trim()},
        ${body.telefone || null}, ${body.endereco || null},
        ${body.logo_url || null}, ${body.cor_primaria || '#3B82F6'},
        ${body.cor_secundaria || '#1E40AF'},
        ${body.horario_abertura || '08:00'}, ${body.horario_fechamento || '18:00'},
        ${body.dias_funcionamento || ['seg', 'ter', 'qua', 'qui', 'sex']}
      )
      RETURNING id, nome, slug, email, created_at
    `;

    return new Response(JSON.stringify(empresa), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao criar empresa' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
