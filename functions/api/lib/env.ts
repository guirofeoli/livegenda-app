// Adaptador de ambiente para Cloudflare Workers
import type { EnvConfig } from "../../../shared/lib/runtime/types";

// Interface do Cloudflare Pages
export interface CloudflareEnv {
  DATABASE_URL: string;
  RESEND_API?: string;
  INFOBIP_BASE_URL?: string;
  INFOBIP_API?: string;
  SESSION_SECRET?: string;
  JWT_SECRET?: string;
  ENVIRONMENT?: string;
  API_VERSION?: string;
  CORS_ORIGIN?: string;
}

// Converter env do Cloudflare para EnvConfig
export function toEnvConfig(env: CloudflareEnv): EnvConfig {
  return {
    DATABASE_URL: env.DATABASE_URL,
    RESEND_API: env.RESEND_API,
    INFOBIP_BASE_URL: env.INFOBIP_BASE_URL,
    INFOBIP_API: env.INFOBIP_API,
    SESSION_SECRET: env.SESSION_SECRET,
  };
}
