// ============================================
// LIVEGENDA - API de Funcionários
// ============================================
// GET e POST para funcionários
// Usa módulos compartilhados para paridade com Express

import type { CloudflareEnv } from '../lib/env';
import { createDbClient } from '../lib/db';
import { toEnvConfig } from '../lib/env';
import { createFuncionarioUseCase } from '../../../shared/lib/use-cases/funcionarios';

// GET /api/funcionarios - Listar funcionários (via shared modules)
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
    const dbClient = createDbClient(context.env.DATABASE_URL);
    const envConfig = toEnvConfig(context.env);
    const useCase = createFuncionarioUseCase({ db: dbClient, env: envConfig });
    
    const funcionarios = await useCase.listarPorEmpresa(empresaId, true);
    
    // Transformar para snake_case
    const result = funcionarios.map((f: any) => ({
      id: f.id,
      empresa_id: f.empresaId,
      nome: f.nome,
      telefone: f.telefone,
      email: f.email,
      cargo: f.cargo,
      cor: f.cor,
      foto: f.foto,
      dias_trabalho: f.diasTrabalho,
      horario_trabalho_inicio: f.horarioTrabalhoInicio,
      horario_trabalho_fim: f.horarioTrabalhoFim,
      ativo: f.ativo,
      criado_em: f.criadoEm
    }));
    
    return new Response(JSON.stringify(result), { 
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

// Helper: Converte dias_trabalho para array (paridade com Express)
function normalizeDiasTrabalho(input: any): string[] | null {
  if (!input) return null;
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    return input.split(',').map(d => d.trim()).filter(d => d.length > 0);
  }
  return null;
}

// POST /api/funcionarios - Criar funcionário (via shared modules com notificações)
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

    const dbClient = createDbClient(context.env.DATABASE_URL);
    const envConfig = toEnvConfig(context.env);
    const useCase = createFuncionarioUseCase({ db: dbClient, env: envConfig });
    
    // Normalizar dias_trabalho para array (compatibilidade com Express)
    const diasTrabalhoNormalized = normalizeDiasTrabalho(dias_trabalho);
    
    const result = await useCase.criar({
      empresaId: empresa_id,
      nome,
      cargo: cargo || null,
      telefone: telefone || null,
      email: email || null,
      cor: cor || null,
      foto: foto || null,
      diasTrabalho: diasTrabalhoNormalized,
      horarioTrabalhoInicio: horario_trabalho_inicio || null,
      horarioTrabalhoFim: horario_trabalho_fim || null,
      ativo: true,
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: true, message: result.error }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
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
      criado_em: funcionario?.criadoEm,
      notificacoes: result.notificacoes
    };

    return new Response(JSON.stringify(response), { 
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
