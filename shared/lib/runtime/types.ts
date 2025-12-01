// Tipos compartilhados para runtime (Express e Cloudflare Workers)

export interface EnvConfig {
  DATABASE_URL: string;
  RESEND_API?: string;
  INFOBIP_BASE_URL?: string;
  INFOBIP_API?: string;
  SESSION_SECRET?: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: any;
}

export interface EmailResult {
  success: boolean;
  data?: any;
  error?: any;
}
