// ============================================
// LIVEGENDA - Health Check Endpoint
// ============================================
// GET /api/health - Verifica status da API e banco

import type { Env, ApiContext } from './_middleware';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const apiContext = (context as any).apiContext as ApiContext;
  
  const startTime = Date.now();
  let dbStatus = 'unknown';
  let dbLatency = 0;

  try {
    // Testar conexão com banco
    const dbStart = Date.now();
    await apiContext.db`SELECT 1 as test`;
    dbLatency = Date.now() - dbStart;
    dbStatus = 'healthy';
  } catch (error) {
    dbStatus = 'unhealthy';
    console.error('Database health check failed:', error);
  }

  const response = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.ENVIRONMENT,
    version: env.API_VERSION,
    latency: {
      total: Date.now() - startTime,
      database: dbLatency,
    },
    services: {
      api: 'healthy',
      database: dbStatus,
    },
  };

  return new Response(JSON.stringify(response), {
    status: dbStatus === 'healthy' ? 200 : 503,
    headers: { 'Content-Type': 'application/json' },
  });
};
