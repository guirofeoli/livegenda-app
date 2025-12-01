// ============================================
// LIVEGENDA - Database Client para Cloudflare Functions
// ============================================
// Usa @neondatabase/serverless diretamente (sem drizzle-orm)
// Compatível com edge runtime do Cloudflare Pages

import { neon } from "@neondatabase/serverless";

export type NeonClient = ReturnType<typeof neon>;

export function createNeonClient(databaseUrl: string): NeonClient {
  return neon(databaseUrl);
}

// Helper para transformar rows de snake_case para camelCase
export function toCamelCase(row: any): any {
  if (!row) return null;
  const result: any = {};
  for (const key in row) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = row[key];
  }
  return result;
}

// Helper para transformar array de rows
export function rowsToCamelCase(rows: any[]): any[] {
  return rows.map(toCamelCase);
}
