// ============================================
// LIVEGENDA - API de Serviços
// ============================================
// CRUD completo para serviços oferecidos

import type { Env, ApiContext } from '../_middleware';

// Validação de serviço
function validateServico(body: any): { valid: boolean; error?: string } {
  if (!body.empresa_id || typeof body.empresa_id !== 'number') {
    return { valid: false, error: 'empresa_id é obrigatório' };
  }
  if (!body.nome || typeof body.nome !== 'string' || body.nome.trim().length < 2) {
    return { valid: false, error: 'Nome é obrigatório (mínimo 2 caracteres)' };
  }
  if (!body.duracao_minutos || typeof body.duracao_minutos !== 'number' || body.duracao_minutos < 5) {
    return { valid: false, error: 'Duração em minutos é obrigatória (mínimo 5)' };
  }
  if (body.preco === undefined || typeof body.preco !== 'number' || body.preco < 0) {
    return { valid: false, error: 'Preço é obrigatório (valor >= 0)' };
  }
  return { valid: true };
}

// GET /api/servicos - Listar serviços da empresa
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;
  const url = new URL(context.request.url);
  
  const empresaId = url.searchParams.get('empresa_id');
  const categoria = url.searchParams.get('categoria');

  if (!empresaId) {
    return new Response(
      JSON.stringify({ error: true, message: 'empresa_id é obrigatório' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    let servicos;
    
    if (categoria) {
      servicos = await db`
        SELECT s.*,
          COALESCE(
            (SELECT json_agg(json_build_object('id', f.id, 'nome', f.nome))
             FROM funcionarios f
             JOIN servicos_funcionarios sf ON f.id = sf.funcionario_id
             WHERE sf.servico_id = s.id AND f.ativo = true),
            '[]'
          ) as funcionarios
        FROM servicos s
        WHERE s.empresa_id = ${parseInt(empresaId)}
          AND s.ativo = true
          AND s.categoria = ${categoria}
        ORDER BY s.nome
        LIMIT 100
      `;
    } else {
      servicos = await db`
        SELECT s.*,
          COALESCE(
            (SELECT json_agg(json_build_object('id', f.id, 'nome', f.nome))
             FROM funcionarios f
             JOIN servicos_funcionarios sf ON f.id = sf.funcionario_id
             WHERE sf.servico_id = s.id AND f.ativo = true),
            '[]'
          ) as funcionarios
        FROM servicos s
        WHERE s.empresa_id = ${parseInt(empresaId)}
          AND s.ativo = true
        ORDER BY s.categoria, s.nome
        LIMIT 100
      `;
    }

    return new Response(JSON.stringify(servicos), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao listar serviços:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao listar serviços' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/servicos - Criar novo serviço
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiContext = (context as any).apiContext as ApiContext;
  const { db } = apiContext;

  try {
    const body = await context.request.json();
    
    // Validação
    const validation = validateServico(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: true, message: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const [servico] = await db`
      INSERT INTO servicos (
        empresa_id, nome, descricao, duracao_minutos, preco,
        categoria, cor
      ) VALUES (
        ${body.empresa_id}, ${body.nome.trim()}, ${body.descricao || null},
        ${body.duracao_minutos}, ${body.preco},
        ${body.categoria || null}, ${body.cor || '#3B82F6'}
      )
      RETURNING id, nome, duracao_minutos, preco, categoria, created_at
    `;

    // Se funcionários foram especificados, vincular ao serviço
    if (body.funcionario_ids && Array.isArray(body.funcionario_ids) && body.funcionario_ids.length > 0) {
      for (const funcId of body.funcionario_ids) {
        if (typeof funcId === 'number') {
          await db`
            INSERT INTO servicos_funcionarios (servico_id, funcionario_id)
            VALUES (${servico.id}, ${funcId})
            ON CONFLICT DO NOTHING
          `;
        }
      }
    }

    return new Response(JSON.stringify(servico), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Erro ao criar serviço' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
