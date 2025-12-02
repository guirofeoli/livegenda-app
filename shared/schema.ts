import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal, pgEnum, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const categoriasEmpresaEnum = pgEnum("categoria_empresa", [
  "salao_beleza",
  "barbearia", 
  "clinica_estetica"
]);

export const statusAgendamentoEnum = pgEnum("status_agendamento", [
  "agendado",
  "confirmado",
  "cancelado"
]);

export const roleUsuarioEnum = pgEnum("role_usuario", [
  "admin",
  "funcionario",
  "recepcionista"
]);

// ============ EMPRESAS ============
export const empresas = pgTable("empresas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  slug: text("slug").unique(),
  categoria: categoriasEmpresaEnum("categoria").notNull(),
  telefone: text("telefone"),
  email: text("email"),
  endereco: text("endereco"), // mantido para compatibilidade
  // Campos estruturados de endereço
  logradouro: text("logradouro"), // rua/avenida + número
  bairro: text("bairro"),
  cidade: text("cidade"),
  estado: text("estado"), // UF (2 letras)
  cep: text("cep"),
  // Coordenadas para busca por proximidade
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  enderecoCompleto: boolean("endereco_completo").default(false), // flag se endereço está preenchido
  logo: text("logo"),
  descricao: text("descricao"),
  horarioAbertura: text("horario_abertura").default("08:00"),
  horarioFechamento: text("horario_fechamento").default("18:00"),
  diasFuncionamento: text("dias_funcionamento").array().default(sql`ARRAY['seg', 'ter', 'qua', 'qui', 'sex']`),
  ativo: boolean("ativo").default(true),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const empresasRelations = relations(empresas, ({ many }) => ({
  usuarios: many(usuarios),
  funcionarios: many(funcionarios),
  clientes: many(clientes),
  servicos: many(servicos),
  agendamentos: many(agendamentos),
}));

// ============ USUÁRIOS (login) ============
export const usuarios = pgTable("usuarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empresaId: varchar("empresa_id").references(() => empresas.id),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senha: text("senha").notNull(),
  role: roleUsuarioEnum("role").default("admin"),
  onboardingConcluido: boolean("onboarding_concluido").default(false),
  ativo: boolean("ativo").default(true),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const usuariosRelations = relations(usuarios, ({ one }) => ({
  empresa: one(empresas, {
    fields: [usuarios.empresaId],
    references: [empresas.id],
  }),
}));

// ============ FUNCIONÁRIOS ============
export const funcionarios = pgTable("funcionarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empresaId: varchar("empresa_id").references(() => empresas.id).notNull(),
  nome: text("nome").notNull(),
  telefone: text("telefone"),
  email: text("email"),
  cargo: text("cargo"),
  foto: text("foto"),
  cor: text("cor"), // cor para exibição no calendário
  diasTrabalho: text("dias_trabalho").array(), // ex: ["seg", "ter", "qua", "qui", "sex"]
  horarioTrabalhoInicio: text("horario_trabalho_inicio"), // ex: "09:00"
  horarioTrabalhoFim: text("horario_trabalho_fim"), // ex: "18:00"
  ativo: boolean("ativo").default(true),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const funcionariosRelations = relations(funcionarios, ({ one, many }) => ({
  empresa: one(empresas, {
    fields: [funcionarios.empresaId],
    references: [empresas.id],
  }),
  agendamentos: many(agendamentos),
  servicosFuncionario: many(servicosFuncionarios),
}));

// ============ CLIENTES ============
export const clientes = pgTable("clientes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empresaId: varchar("empresa_id").references(() => empresas.id).notNull(),
  nome: text("nome").notNull(),
  telefone: text("telefone"),
  email: text("email"),
  observacoes: text("observacoes"),
  ativo: boolean("ativo").default(true),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const clientesRelations = relations(clientes, ({ one, many }) => ({
  empresa: one(empresas, {
    fields: [clientes.empresaId],
    references: [empresas.id],
  }),
  agendamentos: many(agendamentos),
}));

// ============ SERVIÇOS ============
export const servicos = pgTable("servicos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empresaId: varchar("empresa_id").references(() => empresas.id).notNull(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  duracaoMinutos: integer("duracao_minutos").notNull().default(30),
  preco: decimal("preco", { precision: 10, scale: 2 }).notNull(),
  ativo: boolean("ativo").default(true),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const servicosRelations = relations(servicos, ({ one, many }) => ({
  empresa: one(empresas, {
    fields: [servicos.empresaId],
    references: [empresas.id],
  }),
  agendamentos: many(agendamentos),
  servicosFuncionario: many(servicosFuncionarios),
}));

// ============ SERVIÇOS <-> FUNCIONÁRIOS (N:N) ============
export const servicosFuncionarios = pgTable("servicos_funcionarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  servicoId: varchar("servico_id").references(() => servicos.id).notNull(),
  funcionarioId: varchar("funcionario_id").references(() => funcionarios.id).notNull(),
});

export const servicosFuncionariosRelations = relations(servicosFuncionarios, ({ one }) => ({
  servico: one(servicos, {
    fields: [servicosFuncionarios.servicoId],
    references: [servicos.id],
  }),
  funcionario: one(funcionarios, {
    fields: [servicosFuncionarios.funcionarioId],
    references: [funcionarios.id],
  }),
}));

// ============ AGENDAMENTOS ============
export const agendamentos = pgTable("agendamentos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empresaId: varchar("empresa_id").references(() => empresas.id).notNull(),
  clienteId: varchar("cliente_id").references(() => clientes.id).notNull(),
  funcionarioId: varchar("funcionario_id").references(() => funcionarios.id).notNull(),
  servicoId: varchar("servico_id").references(() => servicos.id).notNull(),
  dataHora: timestamp("data_hora").notNull(),
  dataHoraFim: timestamp("data_hora_fim").notNull(),
  status: statusAgendamentoEnum("status").default("agendado"),
  observacoes: text("observacoes"),
  precoFinal: decimal("preco_final", { precision: 10, scale: 2 }),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export const agendamentosRelations = relations(agendamentos, ({ one }) => ({
  empresa: one(empresas, {
    fields: [agendamentos.empresaId],
    references: [empresas.id],
  }),
  cliente: one(clientes, {
    fields: [agendamentos.clienteId],
    references: [clientes.id],
  }),
  funcionario: one(funcionarios, {
    fields: [agendamentos.funcionarioId],
    references: [funcionarios.id],
  }),
  servico: one(servicos, {
    fields: [agendamentos.servicoId],
    references: [servicos.id],
  }),
}));

// ============ INSERT SCHEMAS (Zod) ============
export const insertEmpresaSchema = createInsertSchema(empresas).omit({
  id: true,
  criadoEm: true,
});

export const insertUsuarioSchema = createInsertSchema(usuarios).omit({
  id: true,
  criadoEm: true,
});

export const insertFuncionarioSchema = createInsertSchema(funcionarios).omit({
  id: true,
  criadoEm: true,
});

export const insertClienteSchema = createInsertSchema(clientes).omit({
  id: true,
  criadoEm: true,
});

export const insertServicoSchema = createInsertSchema(servicos).omit({
  id: true,
  criadoEm: true,
});

export const insertAgendamentoSchema = createInsertSchema(agendamentos).omit({
  id: true,
  criadoEm: true,
});

// ============ TYPES ============
export type Empresa = typeof empresas.$inferSelect;
export type InsertEmpresa = z.infer<typeof insertEmpresaSchema>;

export type Usuario = typeof usuarios.$inferSelect;
export type InsertUsuario = z.infer<typeof insertUsuarioSchema>;

export type Funcionario = typeof funcionarios.$inferSelect;
export type InsertFuncionario = z.infer<typeof insertFuncionarioSchema>;

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = z.infer<typeof insertClienteSchema>;

export type Servico = typeof servicos.$inferSelect;
export type InsertServico = z.infer<typeof insertServicoSchema>;

export type Agendamento = typeof agendamentos.$inferSelect;
export type InsertAgendamento = z.infer<typeof insertAgendamentoSchema>;

