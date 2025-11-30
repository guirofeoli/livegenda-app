import type { Express } from "express";
import type { Server } from "http";
import { db } from "./db";
import { usuarios, funcionarios, empresas } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // API: Verificar email
  app.post("/api/auth/check-email", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }
      
      // Verificar se existe em usuarios
      const usuario = await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
      if (usuario.length > 0) {
        const emp = usuario[0].empresaId 
          ? await db.select().from(empresas).where(eq(empresas.id, usuario[0].empresaId)).limit(1)
          : [];
        return res.json({
          type: "usuario",
          nome: usuario[0].nome,
          hasEmpresa: !!usuario[0].empresaId,
          empresaNome: emp[0]?.nome || null
        });
      }
      
      // Verificar se existe em funcionarios
      const funcionario = await db.select().from(funcionarios).where(eq(funcionarios.email, email)).limit(1);
      if (funcionario.length > 0) {
        const emp = await db.select().from(empresas).where(eq(empresas.id, funcionario[0].empresaId)).limit(1);
        return res.json({
          type: "funcionario",
          funcionarioId: funcionario[0].id,
          empresaId: funcionario[0].empresaId,
          empresaNome: emp[0]?.nome || null,
          nome: funcionario[0].nome
        });
      }
      
      // Email novo
      return res.json({ type: "novo" });
    } catch (error) {
      console.error("Erro check-email:", error);
      return res.status(500).json({ error: "Erro interno" });
    }
  });
  
  // API: Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, senha } = req.body;
      
      if (!email || !senha) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
      }
      
      const usuario = await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
      if (usuario.length === 0) {
        return res.status(401).json({ error: "Email não encontrado" });
      }
      
      if (usuario[0].senha !== senha) {
        return res.status(401).json({ error: "Senha incorreta" });
      }
      
      let empresa = null;
      if (usuario[0].empresaId) {
        const emp = await db.select().from(empresas).where(eq(empresas.id, usuario[0].empresaId)).limit(1);
        empresa = emp[0] || null;
      }
      
      return res.json({
        usuario: {
          id: usuario[0].id,
          nome: usuario[0].nome,
          email: usuario[0].email,
          empresaId: usuario[0].empresaId,
          role: usuario[0].role,
          onboarding_concluido: usuario[0].onboardingConcluido || false
        },
        empresa
      });
    } catch (error) {
      console.error("Erro login:", error);
      return res.status(500).json({ error: "Erro interno" });
    }
  });
  
  // API: Onboarding (criar empresa + usuario)
  app.post("/api/auth/onboarding", async (req, res) => {
    try {
      const { nome, email, senha, nomeNegocio, emailNegocio, categoria, telefone, endereco } = req.body;
      
      if (!nome || !email || !senha || !nomeNegocio || !categoria) {
        return res.status(400).json({ error: "Campos obrigatórios faltando" });
      }
      
      // Verificar se email já existe
      const existente = await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
      if (existente.length > 0) {
        return res.status(409).json({ error: "Email já cadastrado" });
      }
      
      // Criar empresa
      const empresaResult = await db.insert(empresas).values({
        nome: nomeNegocio,
        categoria,
        telefone: telefone || null,
        email: emailNegocio || email,
        endereco: endereco || null,
        ativo: true
      }).returning();
      const empresa = empresaResult[0];
      
      // Criar usuario com onboarding concluído
      const usuarioResult = await db.insert(usuarios).values({
        email,
        senha,
        nome,
        empresaId: empresa.id,
        role: "admin",
        onboardingConcluido: true,
        ativo: true
      }).returning();
      const usuario = usuarioResult[0];
      
      return res.status(201).json({
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          empresaId: usuario.empresaId,
          role: usuario.role,
          onboarding_concluido: true
        },
        empresa
      });
    } catch (error) {
      console.error("Erro onboarding:", error);
      return res.status(500).json({ error: "Erro ao criar conta" });
    }
  });
  
  // API: Onboarding funcionario
  app.post("/api/auth/onboarding-funcionario", async (req, res) => {
    try {
      const { funcionarioId, empresaId, email, nome, senha } = req.body;
      
      if (!funcionarioId || !empresaId || !email || !nome || !senha) {
        return res.status(400).json({ error: "Campos obrigatórios faltando" });
      }
      
      // Verificar se funcionario existe
      const func = await db.select().from(funcionarios).where(eq(funcionarios.id, funcionarioId)).limit(1);
      if (func.length === 0) {
        return res.status(404).json({ error: "Funcionário não encontrado" });
      }
      
      // Verificar se email já existe em usuarios
      const existente = await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
      if (existente.length > 0) {
        return res.status(409).json({ error: "Email já em uso" });
      }
      
      // Criar usuario com onboarding concluído
      const usuarioResult = await db.insert(usuarios).values({
        email,
        senha,
        nome,
        empresaId,
        role: "funcionario",
        onboardingConcluido: true,
        ativo: true
      }).returning();
      const usuario = usuarioResult[0];
      
      // Buscar empresa
      const emp = await db.select().from(empresas).where(eq(empresas.id, empresaId)).limit(1);
      
      return res.status(201).json({
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          empresaId: usuario.empresaId,
          role: usuario.role,
          onboarding_concluido: true
        },
        empresa: emp[0]
      });
    } catch (error) {
      console.error("Erro onboarding-funcionario:", error);
      return res.status(500).json({ error: "Erro ao criar conta" });
    }
  });

  return httpServer;
}
