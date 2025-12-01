// ============================================
// LIVEGENDA - API de Funcionários (ID)
// ============================================
// GET, PUT, DELETE para funcionários individuais
// Usa módulos compartilhados para paridade com Express

import type { CloudflareEnv } from '../lib/env';
import { createDbClient } from '../lib/db';
import { toEnvConfig } from '../lib/env';
import { createFuncionarioUseCase } from '../../../shared/lib/use-cases/funcionarios';

// Validação de UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Helper: Converte dias_trabalho para array (paridade com Express)
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
    const dbClient = createDbClient(context.env.DATABASE_URL);
    const envConfig = toEnvConfig(context.env);
    const useCase = createFuncionarioUseCase({ db: dbClient, env: envConfig });
    
    const funcionario = await useCase.buscarPorId(id);
    
    if (!funcionario) {
      return new Response(
        JSON.stringify({ error: true, message: 'Funcionário não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transformar para snake_case
    const result = {
      id: funcionario.id,
      empresa_id: funcionario.empresaId,
      nome: funcionario.nome,
      telefone: funcionario.telefone,
      email: funcionario.email,
      cargo: funcionario.cargo,
      cor: funcionario.cor,
      foto: funcionario.foto,
      dias_trabalho: funcionario.diasTrabalho,
      horario_trabalho_inicio: funcionario.horarioTrabalhoInicio,
      horario_trabalho_fim: funcionario.horarioTrabalhoFim,
      ativo: funcionario.ativo,
      criado_em: funcionario.criadoEm
    };

    return new Response(JSON.stringify(result), {
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
    
    const dbClient = createDbClient(context.env.DATABASE_URL);
    const envConfig = toEnvConfig(context.env);
    const useCase = createFuncionarioUseCase({ db: dbClient, env: envConfig });
    
    // Converter snake_case para camelCase
    const updateData: any = {};
    if (body.nome !== undefined) updateData.nome = body.nome;
    if (body.cargo !== undefined) updateData.cargo = body.cargo;
    if (body.telefone !== undefined) updateData.telefone = body.telefone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.cor !== undefined) updateData.cor = body.cor;
    if (body.foto !== undefined) updateData.foto = body.foto;
    if (body.dias_trabalho !== undefined) updateData.diasTrabalho = normalizeDiasTrabalho(body.dias_trabalho);
    if (body.horario_trabalho_inicio !== undefined) updateData.horarioTrabalhoInicio = body.horario_trabalho_inicio;
    if (body.horario_trabalho_fim !== undefined) updateData.horarioTrabalhoFim = body.horario_trabalho_fim;
    if (body.ativo !== undefined) updateData.ativo = body.ativo;
    
    const result = await useCase.atualizar(id, updateData);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: true, message: result.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transformar para snake_case
    const funcionario = result.funcionario;
    const response = {
      id: funcionario?.id,
      empresa_id: funcionario?.empresaId,
      nome: funcionario?.nome,
      telefone: funcionario?.telefone,
      email: funcionario?.email,
      cargo: funcionario?.cargo,
      cor: funcionario?.cor,
      foto: funcionario?.foto,
      dias_trabalho: funcionario?.diasTrabalho,
      horario_trabalho_inicio: funcionario?.horarioTrabalhoInicio,
      horario_trabalho_fim: funcionario?.horarioTrabalhoFim,
      ativo: funcionario?.ativo,
      criado_em: funcionario?.criadoEm
    };

    return new Response(JSON.stringify(response), {
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
    const dbClient = createDbClient(context.env.DATABASE_URL);
    const envConfig = toEnvConfig(context.env);
    const useCase = createFuncionarioUseCase({ db: dbClient, env: envConfig });
    
    const result = await useCase.desativar(id);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: true, message: result.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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
