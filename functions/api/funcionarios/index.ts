// ============================================
// LIVEGENDA - API de Funcionários
// ============================================
// CRUD completo para funcionários/profissionais

import type { Env, ApiContext } from '../_middleware';

// Validação de funcionário
function validateFuncionario(body: any): { valid: boolean; error?: string } {
  if (!body.empresa_id || typeof body.empresa_id !== 'number') {
    return { valid: false, error: 'empresa_id é obrigatório' };
  }
  if (!body.nome || typeof body.nome !== 'string' || body.nome.trim().length < 2) {
    return { valid: false, error: 'Nome é obrigatório (mínimo 2 caracteres)' };
  }
  return { valid: true };
}

// GET /api/funcionarios - Listar funcionários da empresa
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const url = new URL(context.request.url);
  
  const empresaId = url.searchParams.get('empresa_id');

  if (!empresaId) {
    return new Response(
      JSON.stringify({ error: true, message: 'empresa_id é obrigatório' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const funcionarios = await db`
      SELECT f.id, f.nome, f.email, f.telefone, f.cargo, f.especialidades,
             f.horario_trabalho, f.dias_trabalho, f.cor_agenda, f.foto_url,
             f.ativo, f.created_at,
             (SELECT COUNT(*) FROM servicos_funcionarios WHERE funcionario_id = f.id) as total_servicos
      FROM funcionarios f
      WHERE f.empresa_id = ${parseInt(empresaId)}
        AND f.ativo = true
      ORDER BY f.nome
      LIMIT 100
    `;

    return new Response(JSON.stringify(funcionarios), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao listar funcionários:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao listar funcionários' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/funcionarios - Criar novo funcionário
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;

  try {
    const body = await context.request.json();
    
    // Validação
    const validation = validateFuncionario(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: true, message: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const [funcionario] = await db`
      INSERT INTO funcionarios (
        empresa_id, nome, email, telefone, cargo, especialidades,
        horario_trabalho, dias_trabalho, cor_agenda, foto_url
      ) VALUES (
        ${body.empresa_id}, ${body.nome.trim()}, ${body.email?.trim() || null},
        ${body.telefone || null}, ${body.cargo || null},
        ${body.especialidades || []}, ${body.horario_trabalho || null},
        ${body.dias_trabalho || ['seg', 'ter', 'qua', 'qui', 'sex']},
        ${body.cor_agenda || '#3B82F6'}, ${body.foto_url || null}
      )
      RETURNING id, nome, email, cargo, created_at
    `;

    return new Response(JSON.stringify(funcionario), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao criar funcionário:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao criar funcionário' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
