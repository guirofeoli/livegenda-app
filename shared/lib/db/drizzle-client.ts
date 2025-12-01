// Implementação do DbClient usando Drizzle ORM
import { eq, and, or, ne, gte, lte, sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../../schema';
import type { DbClient, AgendamentoFilters, AgendamentoCompleto } from './types';
import type { 
  Empresa, InsertEmpresa,
  Usuario, InsertUsuario,
  Funcionario, InsertFuncionario,
  Cliente, InsertCliente,
  Servico, InsertServico,
  Agendamento, InsertAgendamento
} from '../../schema';

export function createDrizzleClient(db: NeonHttpDatabase<typeof schema>): DbClient {
  return {
    // ============ EMPRESAS ============
    async findEmpresaById(id: string): Promise<Empresa | undefined> {
      const result = await db.select().from(schema.empresas).where(eq(schema.empresas.id, id)).limit(1);
      return result[0];
    },

    async findEmpresaBySlug(slug: string): Promise<Empresa | undefined> {
      const result = await db.select().from(schema.empresas).where(eq(schema.empresas.slug, slug)).limit(1);
      return result[0];
    },

    async findEmpresas(ativo?: boolean): Promise<Empresa[]> {
      if (ativo !== undefined) {
        return db.select().from(schema.empresas).where(eq(schema.empresas.ativo, ativo));
      }
      return db.select().from(schema.empresas);
    },

    async insertEmpresa(data: InsertEmpresa): Promise<Empresa> {
      const result = await db.insert(schema.empresas).values(data).returning();
      return result[0];
    },

    async updateEmpresa(id: string, data: Partial<InsertEmpresa>): Promise<Empresa | undefined> {
      const result = await db.update(schema.empresas).set(data).where(eq(schema.empresas.id, id)).returning();
      return result[0];
    },

    // ============ USUÁRIOS ============
    async findUsuarioById(id: string): Promise<Usuario | undefined> {
      const result = await db.select().from(schema.usuarios).where(eq(schema.usuarios.id, id)).limit(1);
      return result[0];
    },

    async findUsuarioByEmail(email: string): Promise<Usuario | undefined> {
      const result = await db.select().from(schema.usuarios).where(eq(schema.usuarios.email, email)).limit(1);
      return result[0];
    },

    async findUsuariosByEmpresa(empresaId: string): Promise<Usuario[]> {
      return db.select().from(schema.usuarios).where(eq(schema.usuarios.empresaId, empresaId));
    },

    async insertUsuario(data: InsertUsuario): Promise<Usuario> {
      const result = await db.insert(schema.usuarios).values(data).returning();
      return result[0];
    },

    async updateUsuario(id: string, data: Partial<InsertUsuario>): Promise<Usuario | undefined> {
      const result = await db.update(schema.usuarios).set(data).where(eq(schema.usuarios.id, id)).returning();
      return result[0];
    },

    // ============ FUNCIONÁRIOS ============
    async findFuncionarioById(id: string): Promise<Funcionario | undefined> {
      const result = await db.select().from(schema.funcionarios).where(eq(schema.funcionarios.id, id)).limit(1);
      return result[0];
    },

    async findFuncionariosByEmpresa(empresaId: string, ativo?: boolean): Promise<Funcionario[]> {
      const conditions = [eq(schema.funcionarios.empresaId, empresaId)];
      if (ativo !== undefined) {
        conditions.push(eq(schema.funcionarios.ativo, ativo));
      }
      return db.select().from(schema.funcionarios).where(and(...conditions));
    },

    async insertFuncionario(data: InsertFuncionario): Promise<Funcionario> {
      const result = await db.insert(schema.funcionarios).values(data).returning();
      return result[0];
    },

    async updateFuncionario(id: string, data: Partial<InsertFuncionario>): Promise<Funcionario | undefined> {
      const result = await db.update(schema.funcionarios).set(data).where(eq(schema.funcionarios.id, id)).returning();
      return result[0];
    },

    async checkFuncionarioEmailExists(email: string, excludeId?: string): Promise<boolean> {
      const conditions = [eq(schema.funcionarios.email, email)];
      if (excludeId) {
        conditions.push(ne(schema.funcionarios.id, excludeId));
      }
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(schema.funcionarios)
        .where(and(...conditions));
      return Number(result[0]?.count || 0) > 0;
    },

    async checkFuncionarioTelefoneExists(telefone: string, excludeId?: string): Promise<boolean> {
      const conditions = [eq(schema.funcionarios.telefone, telefone)];
      if (excludeId) {
        conditions.push(ne(schema.funcionarios.id, excludeId));
      }
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(schema.funcionarios)
        .where(and(...conditions));
      return Number(result[0]?.count || 0) > 0;
    },

    // ============ CLIENTES ============
    async findClienteById(id: string): Promise<Cliente | undefined> {
      const result = await db.select().from(schema.clientes).where(eq(schema.clientes.id, id)).limit(1);
      return result[0];
    },

    async findClientesByEmpresa(empresaId: string, ativo?: boolean): Promise<Cliente[]> {
      const conditions = [eq(schema.clientes.empresaId, empresaId)];
      if (ativo !== undefined) {
        conditions.push(eq(schema.clientes.ativo, ativo));
      }
      return db.select().from(schema.clientes).where(and(...conditions));
    },

    async insertCliente(data: InsertCliente): Promise<Cliente> {
      const result = await db.insert(schema.clientes).values(data).returning();
      return result[0];
    },

    async updateCliente(id: string, data: Partial<InsertCliente>): Promise<Cliente | undefined> {
      const result = await db.update(schema.clientes).set(data).where(eq(schema.clientes.id, id)).returning();
      return result[0];
    },

    async checkClienteEmailExists(email: string, excludeId?: string): Promise<boolean> {
      const conditions = [eq(schema.clientes.email, email)];
      if (excludeId) {
        conditions.push(ne(schema.clientes.id, excludeId));
      }
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(schema.clientes)
        .where(and(...conditions));
      return Number(result[0]?.count || 0) > 0;
    },

    async checkClienteTelefoneExists(telefone: string, excludeId?: string): Promise<boolean> {
      const conditions = [eq(schema.clientes.telefone, telefone)];
      if (excludeId) {
        conditions.push(ne(schema.clientes.id, excludeId));
      }
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(schema.clientes)
        .where(and(...conditions));
      return Number(result[0]?.count || 0) > 0;
    },

    // ============ SERVIÇOS ============
    async findServicoById(id: string): Promise<Servico | undefined> {
      const result = await db.select().from(schema.servicos).where(eq(schema.servicos.id, id)).limit(1);
      return result[0];
    },

    async findServicosByEmpresa(empresaId: string, ativo?: boolean): Promise<Servico[]> {
      const conditions = [eq(schema.servicos.empresaId, empresaId)];
      if (ativo !== undefined) {
        conditions.push(eq(schema.servicos.ativo, ativo));
      }
      return db.select().from(schema.servicos).where(and(...conditions));
    },

    async insertServico(data: InsertServico): Promise<Servico> {
      const result = await db.insert(schema.servicos).values(data).returning();
      return result[0];
    },

    async updateServico(id: string, data: Partial<InsertServico>): Promise<Servico | undefined> {
      const result = await db.update(schema.servicos).set(data).where(eq(schema.servicos.id, id)).returning();
      return result[0];
    },

    // ============ AGENDAMENTOS ============
    async findAgendamentoById(id: string): Promise<Agendamento | undefined> {
      const result = await db.select().from(schema.agendamentos).where(eq(schema.agendamentos.id, id)).limit(1);
      return result[0];
    },

    async findAgendamentosByEmpresa(empresaId: string, filters?: AgendamentoFilters): Promise<Agendamento[]> {
      const conditions = [eq(schema.agendamentos.empresaId, empresaId)];
      
      if (filters?.clienteId) {
        conditions.push(eq(schema.agendamentos.clienteId, filters.clienteId));
      }
      if (filters?.funcionarioId) {
        conditions.push(eq(schema.agendamentos.funcionarioId, filters.funcionarioId));
      }
      if (filters?.status) {
        conditions.push(eq(schema.agendamentos.status, filters.status as any));
      }
      if (filters?.dataInicio) {
        conditions.push(gte(schema.agendamentos.dataHora, filters.dataInicio));
      }
      if (filters?.dataFim) {
        conditions.push(lte(schema.agendamentos.dataHora, filters.dataFim));
      }
      
      return db.select().from(schema.agendamentos).where(and(...conditions));
    },

    async findAgendamentosCompletosByEmpresa(empresaId: string, filters?: AgendamentoFilters): Promise<AgendamentoCompleto[]> {
      const result = await db.query.agendamentos.findMany({
        where: (agendamentos, { eq: eqOp, and: andOp, gte: gteOp, lte: lteOp }) => {
          const conditions: any[] = [eqOp(agendamentos.empresaId, empresaId)];
          
          if (filters?.clienteId) {
            conditions.push(eqOp(agendamentos.clienteId, filters.clienteId));
          }
          if (filters?.funcionarioId) {
            conditions.push(eqOp(agendamentos.funcionarioId, filters.funcionarioId));
          }
          if (filters?.status) {
            conditions.push(eqOp(agendamentos.status, filters.status as any));
          }
          if (filters?.dataInicio) {
            conditions.push(gteOp(agendamentos.dataHora, filters.dataInicio));
          }
          if (filters?.dataFim) {
            conditions.push(lteOp(agendamentos.dataHora, filters.dataFim));
          }
          
          return andOp(...conditions);
        },
        with: {
          cliente: true,
          funcionario: true,
          servico: true,
          empresa: true,
        },
        orderBy: (agendamentos, { desc }) => [desc(agendamentos.dataHora)],
        limit: 500,
      });
      return result as AgendamentoCompleto[];
    },

    async findAgendamentoCompleto(id: string): Promise<AgendamentoCompleto | undefined> {
      const result = await db.query.agendamentos.findFirst({
        where: eq(schema.agendamentos.id, id),
        with: {
          cliente: true,
          funcionario: true,
          servico: true,
          empresa: true,
        }
      });
      return result as AgendamentoCompleto | undefined;
    },

    async insertAgendamento(data: InsertAgendamento): Promise<Agendamento> {
      const result = await db.insert(schema.agendamentos).values(data).returning();
      return result[0];
    },

    async updateAgendamento(id: string, data: Partial<InsertAgendamento>): Promise<Agendamento | undefined> {
      const result = await db.update(schema.agendamentos).set(data).where(eq(schema.agendamentos.id, id)).returning();
      return result[0];
    },

    async checkConflito(funcionarioId: string, dataHora: Date, dataHoraFim: Date, excludeId?: string): Promise<boolean> {
      const conditions = [
        eq(schema.agendamentos.funcionarioId, funcionarioId),
        ne(schema.agendamentos.status, 'cancelado'),
        or(
          and(
            lte(schema.agendamentos.dataHora, dataHora),
            gte(schema.agendamentos.dataHoraFim, dataHora)
          ),
          and(
            lte(schema.agendamentos.dataHora, dataHoraFim),
            gte(schema.agendamentos.dataHoraFim, dataHoraFim)
          ),
          and(
            gte(schema.agendamentos.dataHora, dataHora),
            lte(schema.agendamentos.dataHoraFim, dataHoraFim)
          )
        )
      ];
      
      if (excludeId) {
        conditions.push(ne(schema.agendamentos.id, excludeId));
      }
      
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(schema.agendamentos)
        .where(and(...conditions));
      
      return Number(result[0]?.count || 0) > 0;
    }
  };
}
