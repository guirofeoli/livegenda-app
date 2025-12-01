// Configuração do Drizzle para Cloudflare Workers
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../../../shared/schema";
import { createDrizzleClient } from "../../../shared/lib/db/drizzle-client";
import type { DbClient } from "../../../shared/lib/db/types";

export function createDbClient(databaseUrl: string): DbClient {
  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });
  return createDrizzleClient(db);
}

// Re-export types
export type { DbClient } from "../../../shared/lib/db/types";
