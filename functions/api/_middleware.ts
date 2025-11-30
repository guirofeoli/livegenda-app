// ============================================
// LIVEGENDA - API Middleware
// ============================================
// Middleware global para todas as rotas da API
// Handles: CORS, Auth, Logging, Error handling

import { neon, NeonQueryFunction } from '@neondatabase/serverless';

// Tipos para o contexto do Worker
export interface Env {
  DATABASE_URL: string;
  ENVIRONMENT: string;
  API_VERSION: string;
  CORS_ORIGIN: string;
  JWT_SECRET?: string;
}

export interface ApiContext {
  env: Env;
  db: NeonQueryFunction<false, false>;
  user?: {
    id: string;
    empresaId: string;
    role: string;
  };
}

// Lista de origens permitidas
const ALLOWED_ORIGINS = [
  'https://livegenda.pages.dev',
  'https://app.livegenda.com',
  'https://livegenda.com',
  'http://localhost:5000',
  'http://localhost:3000',
];

// Verificar se origem é permitida
function isOriginAllowed(origin: string | null, env: Env): boolean {
  if (!origin) return false;
  
  // Em produção, usar lista estrita
  if (env.ENVIRONMENT === 'production') {
    return ALLOWED_ORIGINS.includes(origin) || origin === env.CORS_ORIGIN;
  }
  
  // Em dev/preview, permitir origens de preview do Cloudflare
  if (origin.endsWith('.livegenda.pages.dev') || 
      origin.endsWith('.pages.dev') ||
      origin.startsWith('http://localhost')) {
    return true;
  }
  
  return ALLOWED_ORIGINS.includes(origin);
}

// Headers CORS
const getCorsHeaders = (origin: string | null, env: Env) => {
  const allowedOrigin = origin && isOriginAllowed(origin, env) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false',
  };
};

// Erro padronizado (sem expor detalhes do banco)
function createErrorResponse(message: string, status: number, origin: string | null, env: Env) {
  return new Response(
    JSON.stringify({
      error: true,
      message,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(origin, env),
      },
    }
  );
}

// Singleton para conexão do banco (evitar criar múltiplas conexões)
let dbConnection: NeonQueryFunction<false, false> | null = null;

function getDbConnection(databaseUrl: string): NeonQueryFunction<false, false> {
  if (!dbConnection) {
    dbConnection = neon(databaseUrl);
  }
  return dbConnection;
}

// Middleware principal
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');

  // Validar origem
  if (origin && !isOriginAllowed(origin, env)) {
    console.warn(`CORS blocked: ${origin}`);
    return createErrorResponse('Origin not allowed', 403, origin, env);
  }

  // Handle preflight requests (OPTIONS)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin, env),
    });
  }

  // Log da requisição (apenas em dev/preview)
  if (env.ENVIRONMENT !== 'production') {
    console.log(`[${new Date().toISOString()}] ${request.method} ${url.pathname}`);
  }

  try {
    // Validar DATABASE_URL
    if (!env.DATABASE_URL) {
      console.error('DATABASE_URL not configured');
      return createErrorResponse('Service configuration error', 503, origin, env);
    }

    // Inicializar conexão com banco (singleton)
    const db = getDbConnection(env.DATABASE_URL);
    
    // Adicionar contexto via context.data (forma correta do Cloudflare)
    context.data.env = env;
    context.data.db = db;

    // Verificar autenticação (se necessário)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // TODO: Implementar verificação JWT
      // const token = authHeader.slice(7);
      // const user = await verifyToken(token, env.JWT_SECRET);
      // context.data.user = user;
    }

    // Continuar para a rota
    const response = await next();

    // Adicionar headers CORS à resposta
    const newHeaders = new Headers(response.headers);
    Object.entries(getCorsHeaders(origin, env)).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
    
  } catch (error) {
    console.error('API Error:', error);
    
    // Resposta de erro padronizada (NÃO expor detalhes do banco)
    const message = env.ENVIRONMENT !== 'production' && error instanceof Error 
      ? error.message 
      : 'Internal server error';
    
    return createErrorResponse(message, 500, origin, env);
  }
};
