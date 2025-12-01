import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { db } from "./db";
import { usuarios, funcionarios, empresas, clientes, servicos, agendamentos, servicosFuncionarios } from "@shared/schema";
import { eq, and, gte, lte, ne, sql, inArray } from "drizzle-orm";
import { sendWelcomeEmail, sendAgendamentoConfirmacaoEmail, sendAgendamentoRemarcacaoEmail, sendAgendamentoCancelamentoEmail, testWelcomeEmail, testConfirmacaoEmail } from "./email";
import { sendWelcomeSms, sendAgendamentoConfirmacaoSms, sendAgendamentoRemarcacaoSms, sendAgendamentoCancelamentoSms, sendOtpSms } from "./sms";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

// ============ RATE LIMITING SIMPLES ============
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const record = rateLimitStore.get(ip);
    
    if (!record || now > record.resetTime) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({ error: "Muitas requisições. Tente novamente em alguns minutos." });
    }
    
    record.count++;
    return next();
  };
}

// Limpar registros expirados a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// Rate limiter para APIs públicas: 100 requisições por minuto
const publicApiLimiter = rateLimit(100, 60 * 1000);

// Rate limiter para criação de agendamentos: 5 por minuto
const agendamentoLimiter = rateLimit(5, 60 * 1000);

// Rate limiter para envio de códigos de verificação: 3 por minuto
const verificacaoLimiter = rateLimit(3, 60 * 1000);

// ============ VERIFICAÇÃO DE EMAIL COM CÓDIGO OTP ============
interface VerificacaoEmail {
  codigo: string;
  email: string;
  empresaId: string;
  clienteId: string;
  criadoEm: number;
  tentativas: number;
}

const verificacoesAtivas: Map<string, VerificacaoEmail> = new Map();
const VERIFICACAO_EXPIRACAO_MS = 10 * 60 * 1000; // 10 minutos
const MAX_TENTATIVAS = 3;

// Gerar código de 6 dígitos
function gerarCodigoVerificacao(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Gerar token único para verificação
function gerarTokenVerificacao(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Limpar verificações expiradas a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [token, verificacao] of verificacoesAtivas.entries()) {
    if (now - verificacao.criadoEm > VERIFICACAO_EXPIRACAO_MS) {
      verificacoesAtivas.delete(token);
    }
  }
}, 5 * 60 * 1000);

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function convertToSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertToSnakeCase);
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc: any, key) => {
      const snakeKey = toSnakeCase(key);
      acc[snakeKey] = convertToSnakeCase(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

// ============ VALIDAÇÃO DE UNICIDADE GLOBAL EMAIL/TELEFONE ============
// Verifica se email ou telefone já existe em outra tabela (empresa, usuario, cliente, funcionario)
type TableType = 'empresas' | 'usuarios' | 'clientes' | 'funcionarios';

interface UniquenessCheck {
  field: 'email' | 'telefone';
  value: string;
  excludeTable?: TableType;
  excludeId?: string;
  empresaId?: string;
}

interface UniquenessResult {
  exists: boolean;
  table?: TableType;
  nome?: string;
  isEmpresa?: boolean;
}

async function checkGlobalUniqueness(check: UniquenessCheck): Promise<UniquenessResult> {
  const { field, value, excludeTable, excludeId, empresaId } = check;
  
  if (!value || value.trim() === '') {
    return { exists: false };
  }
  
  const normalizedValue = value.toLowerCase().trim();
  const shouldSkip = (table: TableType, matchId: string) => excludeTable === table && excludeId === matchId;
  
  // 1. Verificar em empresas (email global) - case insensitive
  if (field === 'email' && excludeTable !== 'empresas') {
    const empresaMatch = await db.select({ id: empresas.id, nome: empresas.nome })
      .from(empresas)
      .where(and(
        sql`LOWER(${empresas.email}) = ${normalizedValue}`,
        eq(empresas.ativo, true)
      ))
      .limit(1);
    
    if (empresaMatch.length > 0 && !shouldSkip('empresas', empresaMatch[0].id)) {
      return { exists: true, table: 'empresas', nome: empresaMatch[0].nome, isEmpresa: true };
    }
  }
  
  // 2. Verificar em usuarios (email global) - case insensitive
  if (field === 'email' && excludeTable !== 'usuarios') {
    const usuarioMatch = await db.select({ id: usuarios.id, nome: usuarios.nome })
      .from(usuarios)
      .where(sql`LOWER(${usuarios.email}) = ${normalizedValue}`)
      .limit(1);
    
    if (usuarioMatch.length > 0 && !shouldSkip('usuarios', usuarioMatch[0].id)) {
      return { exists: true, table: 'usuarios', nome: usuarioMatch[0].nome };
    }
  }
  
  // 3. Verificar em clientes (email dentro da mesma empresa se aplicável) - case insensitive
  if (field === 'email' && excludeTable !== 'clientes') {
    const clienteConditions: any[] = [
      sql`LOWER(${clientes.email}) = ${normalizedValue}`,
      eq(clientes.ativo, true)
    ];
    if (empresaId) {
      clienteConditions.push(eq(clientes.empresaId, empresaId));
    }
    
    const clienteMatch = await db.select({ id: clientes.id, nome: clientes.nome })
      .from(clientes)
      .where(and(...clienteConditions))
      .limit(1);
    
    if (clienteMatch.length > 0 && !shouldSkip('clientes', clienteMatch[0].id)) {
      return { exists: true, table: 'clientes', nome: clienteMatch[0].nome };
    }
  }
  
  // 4. Verificar em funcionarios (email dentro da mesma empresa se aplicável) - case insensitive
  if (field === 'email' && excludeTable !== 'funcionarios') {
    const funcConditions: any[] = [
      sql`LOWER(${funcionarios.email}) = ${normalizedValue}`,
      eq(funcionarios.ativo, true)
    ];
    if (empresaId) {
      funcConditions.push(eq(funcionarios.empresaId, empresaId));
    }
    
    const funcMatch = await db.select({ id: funcionarios.id, nome: funcionarios.nome })
      .from(funcionarios)
      .where(and(...funcConditions))
      .limit(1);
    
    if (funcMatch.length > 0 && !shouldSkip('funcionarios', funcMatch[0].id)) {
      return { exists: true, table: 'funcionarios', nome: funcMatch[0].nome };
    }
  }
  
  // Telefone - verificar em empresas, clientes e funcionarios
  if (field === 'telefone') {
    const normalizedPhone = normalizedValue.replace(/\D/g, ''); // Remove não-numéricos
    
    // Empresas
    if (excludeTable !== 'empresas') {
      const empresaTelMatch = await db.select({ id: empresas.id, nome: empresas.nome })
        .from(empresas)
        .where(and(
          eq(empresas.telefone, normalizedPhone),
          eq(empresas.ativo, true)
        ))
        .limit(1);
      
      if (empresaTelMatch.length > 0 && !shouldSkip('empresas', empresaTelMatch[0].id)) {
        return { exists: true, table: 'empresas', nome: empresaTelMatch[0].nome, isEmpresa: true };
      }
    }
    
    // Clientes
    if (excludeTable !== 'clientes') {
      const clienteTelConditions: any[] = [
        eq(clientes.telefone, normalizedPhone),
        eq(clientes.ativo, true)
      ];
      if (empresaId) {
        clienteTelConditions.push(eq(clientes.empresaId, empresaId));
      }
      
      const clienteTelMatch = await db.select({ id: clientes.id, nome: clientes.nome })
        .from(clientes)
        .where(and(...clienteTelConditions))
        .limit(1);
      
      if (clienteTelMatch.length > 0 && !shouldSkip('clientes', clienteTelMatch[0].id)) {
        return { exists: true, table: 'clientes', nome: clienteTelMatch[0].nome };
      }
    }
    
    // Funcionários
    if (excludeTable !== 'funcionarios') {
      const funcTelConditions: any[] = [
        eq(funcionarios.telefone, normalizedPhone),
        eq(funcionarios.ativo, true)
      ];
      if (empresaId) {
        funcTelConditions.push(eq(funcionarios.empresaId, empresaId));
      }
      
      const funcTelMatch = await db.select({ id: funcionarios.id, nome: funcionarios.nome })
        .from(funcionarios)
        .where(and(...funcTelConditions))
        .limit(1);
      
      if (funcTelMatch.length > 0 && !shouldSkip('funcionarios', funcTelMatch[0].id)) {
        return { exists: true, table: 'funcionarios', nome: funcTelMatch[0].nome };
      }
    }
  }
  
  return { exists: false };
}

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
          empresa_id: usuario[0].empresaId,
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
      const { 
        nome, email, senha, nomeNegocio, emailNegocio, categoria, telefone,
        logradouro, bairro, cidade, estado, cep 
      } = req.body;
      
      if (!nome || !email || !senha || !nomeNegocio || !categoria) {
        return res.status(400).json({ error: "Campos obrigatórios faltando" });
      }
      
      // Verificar se email já existe
      const existente = await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
      if (existente.length > 0) {
        return res.status(409).json({ error: "Email já cadastrado" });
      }
      
      // Montar endereço completo para exibição
      const partesEndereco = [logradouro, bairro, cidade, estado].filter(Boolean);
      const enderecoFormatado = partesEndereco.length > 0 ? partesEndereco.join(', ') : null;
      
      // Flag se endereço está completo (cidade e estado preenchidos)
      const enderecoCompleto = Boolean(cidade && estado);
      
      // Tentar geocodificar se tiver endereço
      let latitude = null;
      let longitude = null;
      
      if (enderecoCompleto && logradouro) {
        try {
          const enderecoParaGeo = `${logradouro}, ${bairro || ''}, ${cidade}, ${estado}, Brasil`;
          const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoParaGeo)}&limit=1`;
          
          const geoRes = await fetch(geoUrl, {
            headers: { 'User-Agent': 'Livegenda/1.0' }
          });
          
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.length > 0) {
              latitude = parseFloat(geoData[0].lat);
              longitude = parseFloat(geoData[0].lon);
            }
          }
        } catch (geoErr) {
          console.warn('Geocoding falhou, continuando sem coordenadas:', geoErr);
        }
      }
      
      // Criar empresa
      const empresaResult = await db.insert(empresas).values({
        nome: nomeNegocio,
        categoria,
        telefone: telefone || null,
        email: emailNegocio || email,
        endereco: enderecoFormatado,
        logradouro: logradouro || null,
        bairro: bairro || null,
        cidade: cidade || null,
        estado: estado || null,
        cep: cep || null,
        latitude,
        longitude,
        enderecoCompleto,
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
          empresa_id: usuario.empresaId,
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
          empresa_id: usuario.empresaId,
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

  // ============ HEALTH CHECK ============
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ============ EMAIL TESTS ============
  app.post("/api/test-email/boas-vindas", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }
      const result = await testWelcomeEmail(email);
      res.json(result);
    } catch (error) {
      console.error("Erro ao enviar email de teste:", error);
      res.status(500).json({ error: "Erro interno", details: String(error) });
    }
  });

  app.post("/api/test-email/confirmacao", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }
      const result = await testConfirmacaoEmail(email);
      res.json(result);
    } catch (error) {
      console.error("Erro ao enviar email de teste:", error);
      res.status(500).json({ error: "Erro interno", details: String(error) });
    }
  });

  // ============ EMPRESAS ============
  app.get("/api/empresas", async (req, res) => {
    try {
      const result = await db.select().from(empresas).where(eq(empresas.ativo, true));
      res.json(convertToSnakeCase(result));
    } catch (error) {
      console.error("Erro listar empresas:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.get("/api/empresas/:id", async (req, res) => {
    try {
      const result = await db.select().from(empresas).where(eq(empresas.id, req.params.id)).limit(1);
      if (result.length === 0) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }
      res.json(convertToSnakeCase(result[0]));
    } catch (error) {
      console.error("Erro buscar empresa:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.put("/api/empresas/:id", async (req, res) => {
    try {
      const { 
        nome, categoria, telefone, email, endereco, 
        horario_abertura, horario_fechamento, dias_funcionamento,
        // Campos de endereço estruturado
        logradouro, bairro, cidade, estado, cep,
        latitude, longitude
      } = req.body;
      
      // Verificar se endereço está completo (cidade, estado e cep são obrigatórios)
      const enderecoCompleto = !!(cidade && estado && cep);
      
      // Gerar endereco formatado a partir dos campos estruturados
      let enderecoFormatado = endereco;
      if (logradouro || bairro || cidade || estado) {
        const partes = [logradouro, bairro, cidade, estado].filter(Boolean);
        enderecoFormatado = partes.join(', ');
        if (cep) enderecoFormatado += ` - CEP: ${cep}`;
      }
      
      const result = await db.update(empresas).set({
        nome, categoria, telefone, email, 
        endereco: enderecoFormatado,
        logradouro, bairro, cidade, estado, cep,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        enderecoCompleto,
        horarioAbertura: horario_abertura, 
        horarioFechamento: horario_fechamento, 
        diasFuncionamento: dias_funcionamento
      }).where(eq(empresas.id, req.params.id)).returning();
      res.json(convertToSnakeCase(result[0]));
    } catch (error) {
      console.error("Erro atualizar empresa:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // Atualizar slug da empresa (URL personalizada)
  app.patch("/api/empresas/:id/slug", async (req, res) => {
    try {
      const { slug } = req.body;
      const empresaId = req.params.id;
      
      // Validação do slug
      if (!slug || typeof slug !== 'string') {
        return res.status(400).json({ error: "Slug é obrigatório" });
      }
      
      // Validar formato (apenas letras minúsculas, números e hífens)
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        return res.status(400).json({ error: "Slug inválido. Use apenas letras minúsculas, números e hífens." });
      }
      
      // Validar tamanho
      if (slug.length < 3 || slug.length > 50) {
        return res.status(400).json({ error: "Slug deve ter entre 3 e 50 caracteres" });
      }
      
      // Verificar se a empresa existe
      const empresaResult = await db.select().from(empresas).where(eq(empresas.id, empresaId)).limit(1);
      if (empresaResult.length === 0) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }
      
      // Verificar se o slug já está em uso por outra empresa
      const existingSlug = await db.select().from(empresas)
        .where(and(eq(empresas.slug, slug), ne(empresas.id, empresaId)))
        .limit(1);
        
      if (existingSlug.length > 0) {
        return res.status(409).json({ error: "Este identificador já está em uso" });
      }
      
      // Atualizar o slug
      const result = await db.update(empresas)
        .set({ slug })
        .where(eq(empresas.id, empresaId))
        .returning();
      
      res.json(convertToSnakeCase(result[0]));
    } catch (error) {
      console.error("Erro atualizar slug:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // ============ UPLOAD DE LOGO (Object Storage) ============
  // Obter URL de upload presigned para logo da empresa
  app.post("/api/empresas/:id/logo/upload-url", async (req, res) => {
    try {
      const empresaId = req.params.id;
      const { fileExtension } = req.body;
      
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const ext = (fileExtension || 'png').toLowerCase().replace('.', '');
      
      if (!allowedExtensions.includes(ext)) {
        return res.status(400).json({ error: "Formato não suportado. Use JPG, PNG, GIF ou WebP." });
      }
      
      const empresaResult = await db.select().from(empresas).where(eq(empresas.id, empresaId)).limit(1);
      if (empresaResult.length === 0) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }
      
      const objectStorage = new ObjectStorageService();
      const { uploadURL, objectPath } = await objectStorage.getLogoUploadURL(empresaId, ext);
      
      res.json({ uploadURL, objectPath });
    } catch (error) {
      console.error("Erro obter URL de upload:", error);
      res.status(500).json({ error: "Erro ao preparar upload" });
    }
  });

  // Atualizar logo da empresa após upload (salva o path e configura ACL)
  app.put("/api/empresas/:id/logo", async (req, res) => {
    try {
      const empresaId = req.params.id;
      const { logoPath, logoURL } = req.body;
      
      const empresaResult = await db.select().from(empresas).where(eq(empresas.id, empresaId)).limit(1);
      if (empresaResult.length === 0) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }
      
      const objectStorage = new ObjectStorageService();
      const logoAnterior = empresaResult[0].logo;
      
      // Se logoPath é null, remover logo
      if (logoPath === null) {
        if (logoAnterior && logoAnterior.startsWith('/objects/')) {
          try {
            await objectStorage.deleteObjectEntity(logoAnterior);
          } catch (e) {
            console.error("Erro ao deletar logo anterior:", e);
          }
        }
        
        const result = await db.update(empresas)
          .set({ logo: null })
          .where(eq(empresas.id, empresaId))
          .returning();
        
        return res.json(convertToSnakeCase(result[0]));
      }
      
      // Normalizar o path se veio uma URL completa
      let normalizedPath = logoPath;
      if (logoURL && logoURL.startsWith('https://')) {
        normalizedPath = objectStorage.normalizeObjectEntityPath(logoURL);
      }
      
      // Configurar ACL como público (para exibir em páginas públicas)
      if (normalizedPath && normalizedPath.startsWith('/objects/')) {
        try {
          await objectStorage.trySetObjectEntityAclPolicy(normalizedPath, {
            owner: empresaId,
            visibility: "public",
          });
        } catch (e) {
          console.error("Erro ao configurar ACL:", e);
        }
        
        // Deletar logo anterior
        if (logoAnterior && logoAnterior.startsWith('/objects/') && logoAnterior !== normalizedPath) {
          try {
            await objectStorage.deleteObjectEntity(logoAnterior);
          } catch (e) {
            console.error("Erro ao deletar logo anterior:", e);
          }
        }
      }
      
      const result = await db.update(empresas)
        .set({ logo: normalizedPath })
        .where(eq(empresas.id, empresaId))
        .returning();
      
      res.json(convertToSnakeCase(result[0]));
    } catch (error) {
      console.error("Erro atualizar logo:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // Servir arquivos do Object Storage (logos e outros objetos) - /objects/logos/filename.jpg
  app.get("/objects/logos/:filename", async (req, res) => {
    try {
      const objectPath = `/objects/logos/${req.params.filename}`;
      const objectStorage = new ObjectStorageService();
      const objectFile = await objectStorage.getObjectEntityFile(objectPath);
      await objectStorage.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Arquivo não encontrado" });
      }
      console.error("Erro servir objeto:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // Rota alternativa via /api/ para funcionar com proxy do Vite/Replit
  app.get("/api/objects/logos/:filename", async (req, res) => {
    try {
      const objectPath = `/objects/logos/${req.params.filename}`;
      const objectStorage = new ObjectStorageService();
      const objectFile = await objectStorage.getObjectEntityFile(objectPath);
      await objectStorage.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Arquivo não encontrado" });
      }
      console.error("Erro servir objeto:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // Servir arquivos do Object Storage (uploads genéricos) - /objects/uploads/filename
  app.get("/objects/uploads/:filename", async (req, res) => {
    try {
      const objectPath = `/objects/uploads/${req.params.filename}`;
      const objectStorage = new ObjectStorageService();
      const objectFile = await objectStorage.getObjectEntityFile(objectPath);
      await objectStorage.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Arquivo não encontrado" });
      }
      console.error("Erro servir objeto:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // Servir arquivos públicos do Object Storage
  app.get("/public-objects/:filename", async (req, res) => {
    try {
      const filePath = req.params.filename;
      const objectStorage = new ObjectStorageService();
      const file = await objectStorage.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "Arquivo não encontrado" });
      }
      await objectStorage.downloadObject(file, res);
    } catch (error) {
      console.error("Erro servir arquivo público:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // ============ CLIENTES ============
  app.get("/api/clientes", async (req, res) => {
    try {
      const empresaId = req.query.empresa_id as string;
      if (!empresaId) {
        return res.status(400).json({ error: "empresa_id obrigatório" });
      }
      const result = await db.select().from(clientes)
        .where(and(eq(clientes.empresaId, empresaId), eq(clientes.ativo, true)));
      res.json(convertToSnakeCase(result));
    } catch (error) {
      console.error("Erro listar clientes:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.post("/api/clientes", async (req, res) => {
    try {
      const { empresa_id, nome, telefone, email, observacoes } = req.body;
      if (!empresa_id || !nome) {
        return res.status(400).json({ error: "empresa_id e nome obrigatórios" });
      }
      
      // Validar unicidade global de email se fornecido
      if (email) {
        const emailCheck = await checkGlobalUniqueness({
          field: 'email',
          value: email,
          excludeTable: 'clientes',
          empresaId: empresa_id
        });
        
        if (emailCheck.exists) {
          const tabela = emailCheck.table === 'empresas' ? 'uma empresa' : 
                         emailCheck.table === 'usuarios' ? 'um usuário' :
                         emailCheck.table === 'funcionarios' ? 'um funcionário' : 'outro cliente';
          return res.status(409).json({ 
            error: `Este email já está cadastrado em ${tabela}${emailCheck.nome ? ` (${emailCheck.nome})` : ''}` 
          });
        }
      }
      
      // Validar unicidade global de telefone se fornecido
      if (telefone) {
        const telefoneCheck = await checkGlobalUniqueness({
          field: 'telefone',
          value: telefone,
          excludeTable: 'clientes',
          empresaId: empresa_id
        });
        
        if (telefoneCheck.exists) {
          const tabela = telefoneCheck.table === 'empresas' ? 'uma empresa' : 
                         telefoneCheck.table === 'funcionarios' ? 'um funcionário' : 'outro cliente';
          return res.status(409).json({ 
            error: `Este telefone já está cadastrado em ${tabela}${telefoneCheck.nome ? ` (${telefoneCheck.nome})` : ''}` 
          });
        }
      }
      
      const result = await db.insert(clientes).values({
        empresaId: empresa_id, nome, telefone, email, observacoes, ativo: true
      }).returning();
      res.status(201).json(convertToSnakeCase(result[0]));
    } catch (error) {
      console.error("Erro criar cliente:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.get("/api/clientes/:id", async (req, res) => {
    try {
      const result = await db.select().from(clientes).where(eq(clientes.id, req.params.id)).limit(1);
      if (result.length === 0) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      res.json(convertToSnakeCase(result[0]));
    } catch (error) {
      console.error("Erro buscar cliente:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.put("/api/clientes/:id", async (req, res) => {
    try {
      const { nome, telefone, email, observacoes } = req.body;
      const clienteId = req.params.id;
      
      // Buscar cliente atual para pegar empresa_id
      const clienteAtual = await db.select().from(clientes).where(eq(clientes.id, clienteId)).limit(1);
      if (clienteAtual.length === 0) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      
      // Validar unicidade global de email se fornecido
      if (email) {
        const emailCheck = await checkGlobalUniqueness({
          field: 'email',
          value: email,
          excludeTable: 'clientes',
          excludeId: clienteId,
          empresaId: clienteAtual[0].empresaId
        });
        
        if (emailCheck.exists) {
          const tabela = emailCheck.table === 'empresas' ? 'uma empresa' : 
                         emailCheck.table === 'usuarios' ? 'um usuário' :
                         emailCheck.table === 'funcionarios' ? 'um funcionário' : 'outro cliente';
          return res.status(409).json({ 
            error: `Este email já está cadastrado em ${tabela}${emailCheck.nome ? ` (${emailCheck.nome})` : ''}` 
          });
        }
      }
      
      // Validar unicidade global de telefone se fornecido
      if (telefone) {
        const telefoneCheck = await checkGlobalUniqueness({
          field: 'telefone',
          value: telefone,
          excludeTable: 'clientes',
          excludeId: clienteId,
          empresaId: clienteAtual[0].empresaId
        });
        
        if (telefoneCheck.exists) {
          const tabela = telefoneCheck.table === 'empresas' ? 'uma empresa' : 
                         telefoneCheck.table === 'funcionarios' ? 'um funcionário' : 'outro cliente';
          return res.status(409).json({ 
            error: `Este telefone já está cadastrado em ${tabela}${telefoneCheck.nome ? ` (${telefoneCheck.nome})` : ''}` 
          });
        }
      }
      
      const result = await db.update(clientes).set({ nome, telefone, email, observacoes })
        .where(eq(clientes.id, clienteId)).returning();
      res.json(convertToSnakeCase(result[0]));
    } catch (error) {
      console.error("Erro atualizar cliente:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.delete("/api/clientes/:id", async (req, res) => {
    try {
      await db.update(clientes).set({ ativo: false }).where(eq(clientes.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Erro deletar cliente:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // ============ FUNCIONÁRIOS ============
  app.get("/api/funcionarios", async (req, res) => {
    try {
      const empresaId = req.query.empresa_id as string;
      if (!empresaId) {
        return res.status(400).json({ error: "empresa_id obrigatório" });
      }
      const result = await db.select().from(funcionarios)
        .where(and(eq(funcionarios.empresaId, empresaId), eq(funcionarios.ativo, true)));
      
      // Buscar vínculos de serviços para cada funcionário
      const funcionariosComServicos = await Promise.all(result.map(async (func) => {
        const vinculos = await db.select({
          servicoId: servicosFuncionarios.servicoId
        }).from(servicosFuncionarios)
          .where(eq(servicosFuncionarios.funcionarioId, func.id));
        
        return {
          ...convertToSnakeCase(func),
          servico_ids: vinculos.map(v => v.servicoId)
        };
      }));
      
      res.json(funcionariosComServicos);
    } catch (error) {
      console.error("Erro listar funcionários:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.post("/api/funcionarios", async (req, res) => {
    try {
      const { empresa_id, nome, telefone, email, cargo, cor, servico_ids } = req.body;
      if (!empresa_id || !nome) {
        return res.status(400).json({ error: "empresa_id e nome obrigatórios" });
      }
      
      // Validar unicidade global de email se fornecido
      if (email) {
        const emailCheck = await checkGlobalUniqueness({
          field: 'email',
          value: email,
          excludeTable: 'funcionarios',
          empresaId: empresa_id
        });
        
        if (emailCheck.exists) {
          const tabela = emailCheck.table === 'empresas' ? 'uma empresa' : 
                         emailCheck.table === 'usuarios' ? 'um usuário' :
                         emailCheck.table === 'clientes' ? 'um cliente' : 'outro funcionário';
          return res.status(409).json({ 
            error: `Este email já está cadastrado em ${tabela}${emailCheck.nome ? ` (${emailCheck.nome})` : ''}` 
          });
        }
      }
      
      // Validar unicidade global de telefone se fornecido
      if (telefone) {
        const telefoneCheck = await checkGlobalUniqueness({
          field: 'telefone',
          value: telefone,
          excludeTable: 'funcionarios',
          empresaId: empresa_id
        });
        
        if (telefoneCheck.exists) {
          const tabela = telefoneCheck.table === 'empresas' ? 'uma empresa' : 
                         telefoneCheck.table === 'clientes' ? 'um cliente' : 'outro funcionário';
          return res.status(409).json({ 
            error: `Este telefone já está cadastrado em ${tabela}${telefoneCheck.nome ? ` (${telefoneCheck.nome})` : ''}` 
          });
        }
      }
      
      // Validar serviço_ids se fornecido
      if (servico_ids && Array.isArray(servico_ids) && servico_ids.length > 0) {
        const servicosValidos = await db.select().from(servicos)
          .where(and(eq(servicos.empresaId, empresa_id), eq(servicos.ativo, true)));
        const servicosIdsValidos = servicosValidos.map(s => s.id);
        const servicosInvalidos = servico_ids.filter((id: string) => !servicosIdsValidos.includes(id));
        if (servicosInvalidos.length > 0) {
          return res.status(400).json({ error: "Um ou mais serviços selecionados são inválidos" });
        }
      }
      
      const result = await db.insert(funcionarios).values({
        empresaId: empresa_id, nome, telefone, email, cargo, cor, ativo: true
      }).returning();
      
      const novoFuncionario = result[0];
      
      // Criar vínculos com serviços
      if (servico_ids && Array.isArray(servico_ids) && servico_ids.length > 0) {
        const vinculos = servico_ids.map((servicoId: string) => ({
          servicoId,
          funcionarioId: novoFuncionario.id
        }));
        await db.insert(servicosFuncionarios).values(vinculos);
      }
      
      // Enviar email e SMS de boas-vindas
      const empresaResult = await db.select().from(empresas).where(eq(empresas.id, empresa_id)).limit(1);
      const empresaNome = empresaResult[0]?.nome || 'sua empresa';
      
      // Email de boas-vindas
      if (email) {
        sendWelcomeEmail({
          to: email,
          funcionarioNome: nome,
          empresaNome: empresaNome
        }).catch((emailError) => {
          console.error('Falha ao enviar email de boas-vindas:', emailError);
        });
      }
      
      // SMS de boas-vindas
      if (telefone) {
        sendWelcomeSms({
          to: telefone,
          funcionarioNome: nome,
          empresaNome: empresaNome
        }).catch((smsError) => {
          console.error('Falha ao enviar SMS de boas-vindas:', smsError);
        });
      }
      
      res.status(201).json({
        ...convertToSnakeCase(novoFuncionario),
        servico_ids: servico_ids || []
      });
    } catch (error) {
      console.error("Erro criar funcionário:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.get("/api/funcionarios/:id", async (req, res) => {
    try {
      const result = await db.select().from(funcionarios).where(eq(funcionarios.id, req.params.id)).limit(1);
      if (result.length === 0) {
        return res.status(404).json({ error: "Funcionário não encontrado" });
      }
      
      // Buscar vínculos de serviços
      const vinculos = await db.select({
        servicoId: servicosFuncionarios.servicoId
      }).from(servicosFuncionarios)
        .where(eq(servicosFuncionarios.funcionarioId, result[0].id));
      
      res.json({
        ...convertToSnakeCase(result[0]),
        servico_ids: vinculos.map(v => v.servicoId)
      });
    } catch (error) {
      console.error("Erro buscar funcionário:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.put("/api/funcionarios/:id", async (req, res) => {
    try {
      const { nome, telefone, email, cargo, cor, servico_ids } = req.body;
      const funcionarioId = req.params.id;
      
      // Buscar funcionário para validar empresa
      const funcExistente = await db.select().from(funcionarios)
        .where(eq(funcionarios.id, funcionarioId)).limit(1);
      
      if (funcExistente.length === 0) {
        return res.status(404).json({ error: "Funcionário não encontrado" });
      }
      
      const empresaId = funcExistente[0].empresaId;
      
      // Validar unicidade global de email se fornecido
      if (email) {
        const emailCheck = await checkGlobalUniqueness({
          field: 'email',
          value: email,
          excludeTable: 'funcionarios',
          excludeId: funcionarioId,
          empresaId
        });
        
        if (emailCheck.exists) {
          const tabela = emailCheck.table === 'empresas' ? 'uma empresa' : 
                         emailCheck.table === 'usuarios' ? 'um usuário' :
                         emailCheck.table === 'clientes' ? 'um cliente' : 'outro funcionário';
          return res.status(409).json({ 
            error: `Este email já está cadastrado em ${tabela}${emailCheck.nome ? ` (${emailCheck.nome})` : ''}` 
          });
        }
      }
      
      // Validar unicidade global de telefone se fornecido
      if (telefone) {
        const telefoneCheck = await checkGlobalUniqueness({
          field: 'telefone',
          value: telefone,
          excludeTable: 'funcionarios',
          excludeId: funcionarioId,
          empresaId
        });
        
        if (telefoneCheck.exists) {
          const tabela = telefoneCheck.table === 'empresas' ? 'uma empresa' : 
                         telefoneCheck.table === 'clientes' ? 'um cliente' : 'outro funcionário';
          return res.status(409).json({ 
            error: `Este telefone já está cadastrado em ${tabela}${telefoneCheck.nome ? ` (${telefoneCheck.nome})` : ''}` 
          });
        }
      }
      
      // Validar serviço_ids se fornecido
      if (servico_ids && Array.isArray(servico_ids) && servico_ids.length > 0) {
        const servicosValidos = await db.select().from(servicos)
          .where(and(eq(servicos.empresaId, empresaId), eq(servicos.ativo, true)));
        const servicosIdsValidos = servicosValidos.map(s => s.id);
        const servicosInvalidos = servico_ids.filter((id: string) => !servicosIdsValidos.includes(id));
        if (servicosInvalidos.length > 0) {
          return res.status(400).json({ error: "Um ou mais serviços selecionados são inválidos" });
        }
      }
      
      // Atualizar dados do funcionário
      const result = await db.update(funcionarios).set({ nome, telefone, email, cargo, cor })
        .where(eq(funcionarios.id, funcionarioId)).returning();
      
      // Sincronizar vínculos de serviços (remover antigos e inserir novos)
      if (servico_ids !== undefined) {
        // Remover vínculos existentes
        await db.delete(servicosFuncionarios)
          .where(eq(servicosFuncionarios.funcionarioId, funcionarioId));
        
        // Inserir novos vínculos
        if (Array.isArray(servico_ids) && servico_ids.length > 0) {
          const vinculos = servico_ids.map((servicoId: string) => ({
            servicoId,
            funcionarioId
          }));
          await db.insert(servicosFuncionarios).values(vinculos);
        }
      }
      
      // Buscar vínculos atualizados
      const vinculosAtuais = await db.select({
        servicoId: servicosFuncionarios.servicoId
      }).from(servicosFuncionarios)
        .where(eq(servicosFuncionarios.funcionarioId, funcionarioId));
      
      res.json({
        ...convertToSnakeCase(result[0]),
        servico_ids: vinculosAtuais.map(v => v.servicoId)
      });
    } catch (error) {
      console.error("Erro atualizar funcionário:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.delete("/api/funcionarios/:id", async (req, res) => {
    try {
      await db.update(funcionarios).set({ ativo: false }).where(eq(funcionarios.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Erro deletar funcionário:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // ============ SERVIÇOS ============
  app.get("/api/servicos", async (req, res) => {
    try {
      const empresaId = req.query.empresa_id as string;
      if (!empresaId) {
        return res.status(400).json({ error: "empresa_id obrigatório" });
      }
      const result = await db.select().from(servicos)
        .where(and(eq(servicos.empresaId, empresaId), eq(servicos.ativo, true)));
      res.json(convertToSnakeCase(result));
    } catch (error) {
      console.error("Erro listar serviços:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.post("/api/servicos", async (req, res) => {
    try {
      const { empresa_id, nome, descricao, duracao_minutos, preco } = req.body;
      if (!empresa_id || !nome || !preco) {
        return res.status(400).json({ error: "empresa_id, nome e preco obrigatórios" });
      }
      const result = await db.insert(servicos).values({
        empresaId: empresa_id, nome, descricao, 
        duracaoMinutos: duracao_minutos || 30, 
        preco: preco.toString(), 
        ativo: true
      }).returning();
      res.status(201).json(convertToSnakeCase(result[0]));
    } catch (error) {
      console.error("Erro criar serviço:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.get("/api/servicos/:id", async (req, res) => {
    try {
      const result = await db.select().from(servicos).where(eq(servicos.id, req.params.id)).limit(1);
      if (result.length === 0) {
        return res.status(404).json({ error: "Serviço não encontrado" });
      }
      res.json(convertToSnakeCase(result[0]));
    } catch (error) {
      console.error("Erro buscar serviço:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.put("/api/servicos/:id", async (req, res) => {
    try {
      const { nome, descricao, duracao_minutos, preco } = req.body;
      const result = await db.update(servicos).set({ 
        nome, descricao, 
        duracaoMinutos: duracao_minutos, 
        preco: preco?.toString() 
      }).where(eq(servicos.id, req.params.id)).returning();
      res.json(convertToSnakeCase(result[0]));
    } catch (error) {
      console.error("Erro atualizar serviço:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.delete("/api/servicos/:id", async (req, res) => {
    try {
      await db.update(servicos).set({ ativo: false }).where(eq(servicos.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Erro deletar serviço:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // ============ AGENDAMENTOS ============
  app.get("/api/agendamentos", async (req, res) => {
    try {
      const empresaId = req.query.empresa_id as string;
      if (!empresaId) {
        return res.status(400).json({ error: "empresa_id obrigatório" });
      }
      const result = await db.select().from(agendamentos).where(eq(agendamentos.empresaId, empresaId));
      res.json(convertToSnakeCase(result));
    } catch (error) {
      console.error("Erro listar agendamentos:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.post("/api/agendamentos", async (req, res) => {
    try {
      const { empresa_id, cliente_id, funcionario_id, servico_id, data_hora, data_hora_fim, duracao_minutos, observacoes, status } = req.body;
      if (!empresa_id || !cliente_id || !funcionario_id || !servico_id || !data_hora) {
        return res.status(400).json({ error: "Campos obrigatórios faltando" });
      }
      
      const dataHoraInicio = new Date(data_hora);
      let dataHoraFim: Date;
      
      if (data_hora_fim) {
        dataHoraFim = new Date(data_hora_fim);
      } else if (duracao_minutos) {
        dataHoraFim = new Date(dataHoraInicio.getTime() + duracao_minutos * 60000);
      } else {
        // Buscar duração do serviço
        const servicoResult = await db.select().from(servicos).where(eq(servicos.id, servico_id)).limit(1);
        const duracaoServico = servicoResult[0]?.duracaoMinutos || 30;
        dataHoraFim = new Date(dataHoraInicio.getTime() + duracaoServico * 60000);
      }
      
      const result = await db.insert(agendamentos).values({
        empresaId: empresa_id,
        clienteId: cliente_id,
        funcionarioId: funcionario_id,
        servicoId: servico_id,
        dataHora: dataHoraInicio,
        dataHoraFim: dataHoraFim,
        observacoes,
        status: (status || "agendado").toLowerCase()
      }).returning();
      res.status(201).json(convertToSnakeCase(result[0]));
    } catch (error) {
      console.error("Erro criar agendamento:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.get("/api/agendamentos/:id", async (req, res) => {
    try {
      const result = await db.select().from(agendamentos).where(eq(agendamentos.id, req.params.id)).limit(1);
      if (result.length === 0) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }
      res.json(convertToSnakeCase(result[0]));
    } catch (error) {
      console.error("Erro buscar agendamento:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.put("/api/agendamentos/:id", async (req, res) => {
    try {
      const { cliente_id, funcionario_id, servico_id, data_hora, data_hora_fim, observacoes, status } = req.body;
      
      // Buscar agendamento atual antes de atualizar (para verificar mudança de status)
      const agendamentoAtual = await db.select().from(agendamentos)
        .where(eq(agendamentos.id, req.params.id)).limit(1);
      
      if (agendamentoAtual.length === 0) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }
      
      const statusAnterior = agendamentoAtual[0].status;
      const statusNovo = status ? status.toLowerCase() : null;
      
      const updateData: any = {};
      if (cliente_id) updateData.clienteId = cliente_id;
      if (funcionario_id) updateData.funcionarioId = funcionario_id;
      if (servico_id) updateData.servicoId = servico_id;
      if (data_hora) updateData.dataHora = new Date(data_hora);
      if (data_hora_fim) updateData.dataHoraFim = new Date(data_hora_fim);
      if (observacoes !== undefined) updateData.observacoes = observacoes;
      if (statusNovo) updateData.status = statusNovo;
      
      const result = await db.update(agendamentos).set(updateData)
        .where(eq(agendamentos.id, req.params.id)).returning();
      
      // Enviar email e SMS de confirmação quando status muda para "confirmado"
      console.log(`[Notificação Debug PUT] Status anterior: ${statusAnterior}, novo status: ${statusNovo}`);
      if (statusNovo === "confirmado" && statusAnterior !== "confirmado") {
        console.log('[Notificação Debug PUT] Condição satisfeita, buscando dados...');
        const ag = agendamentoAtual[0];
        
        // Buscar dados do cliente
        const clienteResult = await db.select().from(clientes)
          .where(eq(clientes.id, ag.clienteId)).limit(1);
        
        if (clienteResult.length > 0) {
          // Buscar dados da empresa
          const empresaResult = await db.select().from(empresas)
            .where(eq(empresas.id, ag.empresaId)).limit(1);
          
          // Buscar dados do funcionário
          const funcionarioResult = await db.select().from(funcionarios)
            .where(eq(funcionarios.id, ag.funcionarioId)).limit(1);
          
          // Buscar dados do serviço
          const servicoResult = await db.select().from(servicos)
            .where(eq(servicos.id, ag.servicoId)).limit(1);
          
          if (empresaResult.length > 0 && funcionarioResult.length > 0 && servicoResult.length > 0) {
            const cliente = clienteResult[0];
            const empresa = empresaResult[0];
            const funcionario = funcionarioResult[0];
            const servico = servicoResult[0];
            
            // Enviar email se cliente tiver email
            if (cliente.email) {
              console.log(`[Email Debug PUT] Enviando email para: ${cliente.email}`);
              sendAgendamentoConfirmacaoEmail({
                to: cliente.email,
                clienteNome: cliente.nome,
                empresaNome: empresa.nome,
                funcionarioNome: funcionario.nome,
                servicoNome: servico.nome,
                dataHora: ag.dataHora,
                duracaoMinutos: servico.duracaoMinutos || 60,
                preco: servico.preco ? String(servico.preco) : "0",
                empresaTelefone: empresa.telefone || undefined,
                empresaEndereco: empresa.endereco || undefined
              }).catch((emailError) => {
                console.error('[Email Debug PUT] Falha ao enviar email:', emailError);
              });
            }
            
            // Enviar SMS se cliente tiver telefone
            if (cliente.telefone) {
              console.log(`[SMS Debug PUT] Enviando SMS para: ${cliente.telefone}`);
              sendAgendamentoConfirmacaoSms({
                to: cliente.telefone,
                clienteNome: cliente.nome,
                empresaNome: empresa.nome,
                funcionarioNome: funcionario.nome,
                servicoNome: servico.nome,
                dataHora: ag.dataHora,
                preco: servico.preco ? String(servico.preco) : "0"
              }).catch((smsError) => {
                console.error('[SMS Debug PUT] Falha ao enviar SMS:', smsError);
              });
            }
          } else {
            console.log('[Notificação Debug PUT] Dados incompletos - empresa/funcionario/servico não encontrados');
          }
        } else {
          console.log('[Notificação Debug PUT] Cliente não encontrado');
        }
      }
      
      // Enviar notificação de CANCELAMENTO quando status muda para "cancelado"
      if (statusNovo === "cancelado" && statusAnterior !== "cancelado") {
        console.log('[Notificação Cancelamento PUT] Enviando notificação de cancelamento...');
        const ag = agendamentoAtual[0];
        
        const clienteResult = await db.select().from(clientes).where(eq(clientes.id, ag.clienteId)).limit(1);
        
        if (clienteResult.length > 0) {
          const empresaResult = await db.select().from(empresas).where(eq(empresas.id, ag.empresaId)).limit(1);
          const funcionarioResult = await db.select().from(funcionarios).where(eq(funcionarios.id, ag.funcionarioId)).limit(1);
          const servicoResult = await db.select().from(servicos).where(eq(servicos.id, ag.servicoId)).limit(1);
          
          if (empresaResult.length > 0 && funcionarioResult.length > 0 && servicoResult.length > 0) {
            const cliente = clienteResult[0];
            const empresa = empresaResult[0];
            const funcionario = funcionarioResult[0];
            const servico = servicoResult[0];
            
            // Email de cancelamento
            if (cliente.email) {
              sendAgendamentoCancelamentoEmail({
                to: cliente.email,
                clienteNome: cliente.nome,
                empresaNome: empresa.nome,
                funcionarioNome: funcionario.nome,
                servicoNome: servico.nome,
                dataHora: ag.dataHora,
                empresaTelefone: empresa.telefone || undefined
              }).catch((err) => console.error('[Email Cancelamento PUT] Erro:', err));
            }
            
            // SMS de cancelamento
            if (cliente.telefone) {
              sendAgendamentoCancelamentoSms({
                to: cliente.telefone,
                clienteNome: cliente.nome,
                empresaNome: empresa.nome,
                servicoNome: servico.nome,
                dataHora: ag.dataHora,
                empresaTelefone: empresa.telefone || undefined
              }).catch((err) => console.error('[SMS Cancelamento PUT] Erro:', err));
            }
          }
        }
      }
      
      // Enviar notificação de REMARCAÇÃO quando dataHora muda
      const dataHoraAnterior = agendamentoAtual[0].dataHora;
      const dataHoraNova = updateData.dataHora;
      if (dataHoraNova && dataHoraAnterior && dataHoraNova.getTime() !== dataHoraAnterior.getTime()) {
        console.log('[Notificação Remarcação PUT] Enviando notificação de remarcação...');
        const ag = agendamentoAtual[0];
        
        const clienteResult = await db.select().from(clientes).where(eq(clientes.id, ag.clienteId)).limit(1);
        
        if (clienteResult.length > 0) {
          const empresaResult = await db.select().from(empresas).where(eq(empresas.id, ag.empresaId)).limit(1);
          const funcionarioResult = await db.select().from(funcionarios).where(eq(funcionarios.id, ag.funcionarioId)).limit(1);
          const servicoResult = await db.select().from(servicos).where(eq(servicos.id, ag.servicoId)).limit(1);
          
          if (empresaResult.length > 0 && funcionarioResult.length > 0 && servicoResult.length > 0) {
            const cliente = clienteResult[0];
            const empresa = empresaResult[0];
            const funcionario = funcionarioResult[0];
            const servico = servicoResult[0];
            
            // Email de remarcação
            if (cliente.email) {
              sendAgendamentoRemarcacaoEmail({
                to: cliente.email,
                clienteNome: cliente.nome,
                empresaNome: empresa.nome,
                funcionarioNome: funcionario.nome,
                servicoNome: servico.nome,
                dataHoraAnterior: dataHoraAnterior,
                dataHoraNova: dataHoraNova,
                empresaTelefone: empresa.telefone || undefined,
                empresaEndereco: empresa.endereco || undefined
              }).catch((err) => console.error('[Email Remarcação PUT] Erro:', err));
            }
            
            // SMS de remarcação
            if (cliente.telefone) {
              sendAgendamentoRemarcacaoSms({
                to: cliente.telefone,
                clienteNome: cliente.nome,
                empresaNome: empresa.nome,
                funcionarioNome: funcionario.nome,
                servicoNome: servico.nome,
                dataHoraAnterior: dataHoraAnterior,
                dataHoraNova: dataHoraNova
              }).catch((err) => console.error('[SMS Remarcação PUT] Erro:', err));
            }
          }
        }
      }
      
      res.json(convertToSnakeCase(result[0]));
    } catch (error) {
      console.error("Erro atualizar agendamento:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.patch("/api/agendamentos/:id", async (req, res) => {
    try {
      const { status } = req.body;
      const statusLower = status ? status.toLowerCase() : status;
      
      // Buscar agendamento atual antes de atualizar
      const agendamentoAtual = await db.select().from(agendamentos)
        .where(eq(agendamentos.id, req.params.id)).limit(1);
      
      if (agendamentoAtual.length === 0) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }
      
      const statusAnterior = agendamentoAtual[0].status;
      
      // Atualizar status
      const result = await db.update(agendamentos).set({ status: statusLower })
        .where(eq(agendamentos.id, req.params.id)).returning();
      
      // Enviar email e SMS de confirmação quando status muda para "confirmado"
      console.log(`[Notificação Debug PATCH] Status anterior: ${statusAnterior}, novo status: ${statusLower}`);
      if (statusLower === "confirmado" && statusAnterior !== "confirmado") {
        console.log('[Notificação Debug PATCH] Condição satisfeita, buscando dados...');
        const ag = agendamentoAtual[0];
        
        // Buscar dados do cliente
        const clienteResult = await db.select().from(clientes)
          .where(eq(clientes.id, ag.clienteId)).limit(1);
        
        if (clienteResult.length > 0) {
          // Buscar dados da empresa
          const empresaResult = await db.select().from(empresas)
            .where(eq(empresas.id, ag.empresaId)).limit(1);
          
          // Buscar dados do funcionário
          const funcionarioResult = await db.select().from(funcionarios)
            .where(eq(funcionarios.id, ag.funcionarioId)).limit(1);
          
          // Buscar dados do serviço
          const servicoResult = await db.select().from(servicos)
            .where(eq(servicos.id, ag.servicoId)).limit(1);
          
          if (empresaResult.length > 0 && funcionarioResult.length > 0 && servicoResult.length > 0) {
            const cliente = clienteResult[0];
            const empresa = empresaResult[0];
            const funcionario = funcionarioResult[0];
            const servico = servicoResult[0];
            
            // Enviar email se cliente tiver email
            if (cliente.email) {
              console.log(`[Email Debug PATCH] Enviando email para: ${cliente.email}`);
              sendAgendamentoConfirmacaoEmail({
                to: cliente.email,
                clienteNome: cliente.nome,
                empresaNome: empresa.nome,
                funcionarioNome: funcionario.nome,
                servicoNome: servico.nome,
                dataHora: ag.dataHora,
                duracaoMinutos: servico.duracaoMinutos || 60,
                preco: servico.preco ? String(servico.preco) : "0",
                empresaTelefone: empresa.telefone || undefined,
                empresaEndereco: empresa.endereco || undefined
              }).catch((emailError) => {
                console.error('[Email Debug PATCH] Falha ao enviar email:', emailError);
              });
            }
            
            // Enviar SMS se cliente tiver telefone
            if (cliente.telefone) {
              console.log(`[SMS Debug PATCH] Enviando SMS para: ${cliente.telefone}`);
              sendAgendamentoConfirmacaoSms({
                to: cliente.telefone,
                clienteNome: cliente.nome,
                empresaNome: empresa.nome,
                funcionarioNome: funcionario.nome,
                servicoNome: servico.nome,
                dataHora: ag.dataHora,
                preco: servico.preco ? String(servico.preco) : "0"
              }).catch((smsError) => {
                console.error('[SMS Debug PATCH] Falha ao enviar SMS:', smsError);
              });
            }
          } else {
            console.log('[Notificação Debug PATCH] Dados incompletos - empresa/funcionario/servico não encontrados');
          }
        } else {
          console.log('[Notificação Debug PATCH] Cliente não encontrado');
        }
      }
      
      // Enviar notificação de CANCELAMENTO quando status muda para "cancelado"
      if (statusLower === "cancelado" && statusAnterior !== "cancelado") {
        console.log('[Notificação Cancelamento PATCH] Enviando notificação de cancelamento...');
        const ag = agendamentoAtual[0];
        
        const clienteResult = await db.select().from(clientes).where(eq(clientes.id, ag.clienteId)).limit(1);
        
        if (clienteResult.length > 0) {
          const empresaResult = await db.select().from(empresas).where(eq(empresas.id, ag.empresaId)).limit(1);
          const funcionarioResult = await db.select().from(funcionarios).where(eq(funcionarios.id, ag.funcionarioId)).limit(1);
          const servicoResult = await db.select().from(servicos).where(eq(servicos.id, ag.servicoId)).limit(1);
          
          if (empresaResult.length > 0 && funcionarioResult.length > 0 && servicoResult.length > 0) {
            const cliente = clienteResult[0];
            const empresa = empresaResult[0];
            const funcionario = funcionarioResult[0];
            const servico = servicoResult[0];
            
            // Email de cancelamento
            if (cliente.email) {
              sendAgendamentoCancelamentoEmail({
                to: cliente.email,
                clienteNome: cliente.nome,
                empresaNome: empresa.nome,
                funcionarioNome: funcionario.nome,
                servicoNome: servico.nome,
                dataHora: ag.dataHora,
                empresaTelefone: empresa.telefone || undefined
              }).catch((err) => console.error('[Email Cancelamento PATCH] Erro:', err));
            }
            
            // SMS de cancelamento
            if (cliente.telefone) {
              sendAgendamentoCancelamentoSms({
                to: cliente.telefone,
                clienteNome: cliente.nome,
                empresaNome: empresa.nome,
                servicoNome: servico.nome,
                dataHora: ag.dataHora,
                empresaTelefone: empresa.telefone || undefined
              }).catch((err) => console.error('[SMS Cancelamento PATCH] Erro:', err));
            }
          }
        }
      }
      
      res.json(convertToSnakeCase(result[0]));
    } catch (error) {
      console.error("Erro atualizar status:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  app.delete("/api/agendamentos/:id", async (req, res) => {
    try {
      // Buscar agendamento antes de cancelar para enviar notificação
      const agendamentoAtual = await db.select().from(agendamentos)
        .where(eq(agendamentos.id, req.params.id)).limit(1);
      
      if (agendamentoAtual.length > 0 && agendamentoAtual[0].status !== "cancelado") {
        const ag = agendamentoAtual[0];
        
        // Atualizar para cancelado
        await db.update(agendamentos).set({ status: "cancelado" })
          .where(eq(agendamentos.id, req.params.id));
        
        // Enviar notificações de cancelamento
        const clienteResult = await db.select().from(clientes).where(eq(clientes.id, ag.clienteId)).limit(1);
        
        if (clienteResult.length > 0) {
          const empresaResult = await db.select().from(empresas).where(eq(empresas.id, ag.empresaId)).limit(1);
          const funcionarioResult = await db.select().from(funcionarios).where(eq(funcionarios.id, ag.funcionarioId)).limit(1);
          const servicoResult = await db.select().from(servicos).where(eq(servicos.id, ag.servicoId)).limit(1);
          
          if (empresaResult.length > 0 && funcionarioResult.length > 0 && servicoResult.length > 0) {
            const cliente = clienteResult[0];
            const empresa = empresaResult[0];
            const funcionario = funcionarioResult[0];
            const servico = servicoResult[0];
            
            // Email de cancelamento
            if (cliente.email) {
              sendAgendamentoCancelamentoEmail({
                to: cliente.email,
                clienteNome: cliente.nome,
                empresaNome: empresa.nome,
                funcionarioNome: funcionario.nome,
                servicoNome: servico.nome,
                dataHora: ag.dataHora,
                empresaTelefone: empresa.telefone || undefined
              }).catch((err) => console.error('[Email Cancelamento DELETE] Erro:', err));
            }
            
            // SMS de cancelamento
            if (cliente.telefone) {
              sendAgendamentoCancelamentoSms({
                to: cliente.telefone,
                clienteNome: cliente.nome,
                empresaNome: empresa.nome,
                servicoNome: servico.nome,
                dataHora: ag.dataHora,
                empresaTelefone: empresa.telefone || undefined
              }).catch((err) => console.error('[SMS Cancelamento DELETE] Erro:', err));
            }
          }
        }
      } else {
        await db.update(agendamentos).set({ status: "cancelado" })
          .where(eq(agendamentos.id, req.params.id));
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Erro cancelar agendamento:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // ============ APIs PÚBLICAS (Landing Page) ============
  
  // GET: Buscar empresa por slug (perfil público + serviços + funcionários)
  app.get("/api/public/empresas/:slug", publicApiLimiter, async (req, res) => {
    try {
      const { slug } = req.params;
      
      if (!slug || slug.length < 2 || slug.length > 100) {
        return res.status(400).json({ error: "Slug inválido" });
      }
      
      // Buscar empresa pelo slug
      const empresaResult = await db.select().from(empresas)
        .where(and(eq(empresas.slug, slug), eq(empresas.ativo, true)))
        .limit(1);
      
      if (empresaResult.length === 0) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }
      
      const empresa = empresaResult[0];
      
      // Buscar funcionários ativos da empresa
      const funcionariosResult = await db.select({
        id: funcionarios.id,
        nome: funcionarios.nome,
        foto: funcionarios.foto,
        cor: funcionarios.cor,
        cargo: funcionarios.cargo
      }).from(funcionarios)
        .where(and(eq(funcionarios.empresaId, empresa.id), eq(funcionarios.ativo, true)));
      
      // Buscar serviços ativos da empresa
      const servicosResult = await db.select({
        id: servicos.id,
        nome: servicos.nome,
        descricao: servicos.descricao,
        duracaoMinutos: servicos.duracaoMinutos,
        preco: servicos.preco
      }).from(servicos)
        .where(and(eq(servicos.empresaId, empresa.id), eq(servicos.ativo, true)));
      
      // Buscar vínculos serviço-funcionário (apenas dos funcionários da empresa)
      const funcionarioIds = funcionariosResult.map(f => f.id);
      const vinculosResult = funcionarioIds.length > 0 
        ? await db.select({
            servicoId: servicosFuncionarios.servicoId,
            funcionarioId: servicosFuncionarios.funcionarioId
          }).from(servicosFuncionarios)
            .where(inArray(servicosFuncionarios.funcionarioId, funcionarioIds))
        : [];
      
      // Retornar dados públicos (sem dados sensíveis)
      res.json({
        empresa: {
          id: empresa.id,
          nome: empresa.nome,
          slug: empresa.slug,
          categoria: empresa.categoria,
          telefone: empresa.telefone,
          endereco: empresa.endereco,
          logo: empresa.logo,
          descricao: empresa.descricao,
          horario_abertura: empresa.horarioAbertura,
          horario_fechamento: empresa.horarioFechamento,
          dias_funcionamento: empresa.diasFuncionamento
        },
        funcionarios: convertToSnakeCase(funcionariosResult),
        servicos: convertToSnakeCase(servicosResult),
        vinculos: convertToSnakeCase(vinculosResult)
      });
    } catch (error) {
      console.error("Erro buscar empresa pública:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });
  
  // GET: Buscar agenda do dia de um funcionário (horários ocupados/livres)
  app.get("/api/public/agenda/:slug/:funcionarioId/:data", publicApiLimiter, async (req, res) => {
    try {
      const { slug, funcionarioId, data } = req.params;
      
      // Validações básicas
      if (!slug || !funcionarioId || !data) {
        return res.status(400).json({ error: "Parâmetros inválidos" });
      }
      
      // Validar formato da data (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return res.status(400).json({ error: "Data inválida. Use formato YYYY-MM-DD" });
      }
      
      // Verificar se empresa existe
      const empresaResult = await db.select().from(empresas)
        .where(and(eq(empresas.slug, slug), eq(empresas.ativo, true)))
        .limit(1);
      
      if (empresaResult.length === 0) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }
      
      const empresa = empresaResult[0];
      
      // Verificar se é um dia de funcionamento
      const diasSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
      const dataObj = new Date(data + "T12:00:00"); // Usar meio-dia para evitar problemas de timezone
      const diaSemana = diasSemana[dataObj.getDay()];
      const diasFuncionamento = empresa.diasFuncionamento || ['seg', 'ter', 'qua', 'qui', 'sex'];
      
      if (!diasFuncionamento.includes(diaSemana)) {
        return res.json({
          data,
          funcionario_id: funcionarioId,
          horario_abertura: empresa.horarioAbertura,
          horario_fechamento: empresa.horarioFechamento,
          dias_funcionamento: diasFuncionamento,
          dia_fechado: true,
          horarios_ocupados: []
        });
      }
      
      // Verificar se funcionário pertence à empresa
      const funcionarioResult = await db.select().from(funcionarios)
        .where(and(
          eq(funcionarios.id, funcionarioId),
          eq(funcionarios.empresaId, empresa.id),
          eq(funcionarios.ativo, true)
        ))
        .limit(1);
      
      if (funcionarioResult.length === 0) {
        return res.status(404).json({ error: "Funcionário não encontrado" });
      }
      
      const funcionario = funcionarioResult[0];
      
      // Verificar se funcionário trabalha nesse dia
      // Suporta tanto formato abreviado ['seg', 'ter'] quanto completo ['segunda', 'terça']
      const diasTrabalhoFuncionario = funcionario.diasTrabalho;
      if (diasTrabalhoFuncionario && Array.isArray(diasTrabalhoFuncionario) && diasTrabalhoFuncionario.length > 0) {
        // Mapear dias completos para abreviações
        const mapeamentoDias: Record<string, string> = {
          'domingo': 'dom', 'segunda': 'seg', 'terça': 'ter', 'terca': 'ter',
          'quarta': 'qua', 'quinta': 'qui', 'sexta': 'sex', 'sábado': 'sab', 'sabado': 'sab'
        };
        
        // Normalizar dias de trabalho para abreviações
        const diasNormalizados = diasTrabalhoFuncionario.map(d => {
          const diaLower = String(d).toLowerCase().trim();
          return mapeamentoDias[diaLower] || diaLower;
        });
        
        if (!diasNormalizados.includes(diaSemana)) {
          return res.json({
            data,
            funcionario_id: funcionarioId,
            horario_abertura: empresa.horarioAbertura,
            horario_fechamento: empresa.horarioFechamento,
            funcionario_nao_trabalha: true,
            funcionario_dias_trabalho: diasTrabalhoFuncionario,
            horarios_ocupados: []
          });
        }
      }
      
      // Determinar horários de trabalho (prioridade: funcionário > empresa)
      const horarioInicio = funcionario.horarioTrabalhoInicio || empresa.horarioAbertura || '09:00';
      const horarioFim = funcionario.horarioTrabalhoFim || empresa.horarioFechamento || '18:00';
      
      // Calcular início e fim do dia
      const dataInicio = new Date(data + "T00:00:00");
      const dataFim = new Date(data + "T23:59:59");
      
      // Buscar agendamentos do dia (só retorna horários, sem dados do cliente)
      const agendamentosResult = await db.select({
        dataHora: agendamentos.dataHora,
        dataHoraFim: agendamentos.dataHoraFim,
        status: agendamentos.status
      }).from(agendamentos)
        .where(and(
          eq(agendamentos.funcionarioId, funcionarioId),
          eq(agendamentos.empresaId, empresa.id),
          gte(agendamentos.dataHora, dataInicio),
          lte(agendamentos.dataHora, dataFim),
          ne(agendamentos.status, "cancelado")
        ));
      
      // Retornar horários ocupados (sem dados do cliente por privacidade)
      const horariosOcupados = agendamentosResult.map(ag => ({
        inicio: ag.dataHora,
        fim: ag.dataHoraFim
      }));
      
      res.json({
        data,
        funcionario_id: funcionarioId,
        horario_abertura: horarioInicio,
        horario_fechamento: horarioFim,
        funcionario_dias_trabalho: funcionario.diasTrabalho,
        horarios_ocupados: horariosOcupados
      });
    } catch (error) {
      console.error("Erro buscar agenda pública:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });
  
  // GET: Verificar se cliente existe por email ou telefone
  app.get("/api/public/verificar-cliente/:slug", publicApiLimiter, async (req, res) => {
    try {
      const { slug } = req.params;
      const { email, telefone } = req.query;
      
      if (!slug || (!email && !telefone)) {
        return res.status(400).json({ error: "Email ou telefone obrigatório" });
      }
      
      // Verificar empresa
      const empresaResult = await db.select().from(empresas)
        .where(and(eq(empresas.slug, slug), eq(empresas.ativo, true)))
        .limit(1);
      
      if (empresaResult.length === 0) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }
      
      const empresa = empresaResult[0];
      
      // VALIDAR UNICIDADE GLOBAL - Verificar se email/telefone pertence a empresa, usuário ou funcionário
      if (email) {
        const emailNormalizado = (email as string).trim().toLowerCase();
        const emailCheck = await checkGlobalUniqueness({
          field: 'email',
          value: emailNormalizado,
          excludeTable: 'clientes',
          empresaId: empresa.id
        });
        
        if (emailCheck.exists) {
          const tabela = emailCheck.table === 'empresas' ? 'uma empresa' : 
                         emailCheck.table === 'usuarios' ? 'uma conta administrativa' : 'um profissional';
          return res.status(409).json({ 
            error: "email_conflict",
            message: `Este email pertence a ${tabela}${emailCheck.nome ? ` (${emailCheck.nome})` : ''}. Faça login na área administrativa.`,
            redirect_login: emailCheck.table === 'empresas' || emailCheck.table === 'usuarios',
            nome: emailCheck.nome
          });
        }
      }
      
      if (telefone) {
        const telefoneNormalizado = (telefone as string).replace(/\D/g, '');
        const telefoneCheck = await checkGlobalUniqueness({
          field: 'telefone',
          value: telefoneNormalizado,
          excludeTable: 'clientes',
          empresaId: empresa.id
        });
        
        if (telefoneCheck.exists) {
          const tabela = telefoneCheck.table === 'empresas' ? 'uma empresa' : 'um profissional';
          return res.status(409).json({ 
            error: "telefone_conflict",
            message: `Este telefone pertence a ${tabela}${telefoneCheck.nome ? ` (${telefoneCheck.nome})` : ''}.`,
            redirect_login: telefoneCheck.table === 'empresas'
          });
        }
      }
      
      // Buscar cliente por email ou telefone
      let clienteResult: { id: string; nome: string | null; telefone: string | null; email: string | null; }[] = [];
      
      if (email) {
        const emailNormalizado = (email as string).trim().toLowerCase();
        clienteResult = await db.select({
          id: clientes.id,
          nome: clientes.nome,
          telefone: clientes.telefone,
          email: clientes.email
        }).from(clientes)
          .where(and(
            eq(clientes.empresaId, empresa.id),
            eq(clientes.email, emailNormalizado),
            eq(clientes.ativo, true)
          ))
          .limit(1);
      }
      
      // Se não encontrou por email, tenta por telefone
      if (clienteResult.length === 0 && telefone) {
        const telefoneNormalizado = (telefone as string).replace(/\D/g, '');
        clienteResult = await db.select({
          id: clientes.id,
          nome: clientes.nome,
          telefone: clientes.telefone,
          email: clientes.email
        }).from(clientes)
          .where(and(
            eq(clientes.empresaId, empresa.id),
            eq(clientes.telefone, telefoneNormalizado),
            eq(clientes.ativo, true)
          ))
          .limit(1);
      }
      
      if (clienteResult.length > 0) {
        res.json({
          encontrado: true,
          cliente: {
            id: clienteResult[0].id,
            nome: clienteResult[0].nome,
            telefone: clienteResult[0].telefone,
            email: clienteResult[0].email
          }
        });
      } else {
        res.json({ encontrado: false });
      }
    } catch (error) {
      console.error("Erro verificar cliente:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // GET: Buscar agendamentos da semana (API batch - otimizada)
  app.get("/api/public/agenda-semana/:slug", publicApiLimiter, async (req, res) => {
    try {
      const { slug } = req.params;
      const { inicio, fim, funcionario_id } = req.query;
      
      // Validações
      if (!slug || !inicio || !fim) {
        return res.status(400).json({ error: "Parâmetros obrigatórios: inicio, fim" });
      }
      
      // Validar formato das datas
      if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio as string) || !/^\d{4}-\d{2}-\d{2}$/.test(fim as string)) {
        return res.status(400).json({ error: "Datas inválidas. Use formato YYYY-MM-DD" });
      }
      
      // Verificar empresa
      const empresaResult = await db.select().from(empresas)
        .where(and(eq(empresas.slug, slug), eq(empresas.ativo, true)))
        .limit(1);
      
      if (empresaResult.length === 0) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }
      
      const empresa = empresaResult[0];
      
      // Buscar funcionários ativos da empresa
      let funcionariosQuery = db.select({ id: funcionarios.id })
        .from(funcionarios)
        .where(and(eq(funcionarios.empresaId, empresa.id), eq(funcionarios.ativo, true)));
      
      const funcionariosResult = await funcionariosQuery;
      const funcionarioIds = funcionario_id 
        ? [funcionario_id as string] 
        : funcionariosResult.map(f => f.id);
      
      if (funcionarioIds.length === 0) {
        return res.json({ agendamentos: [] });
      }
      
      // Buscar todos os agendamentos do período
      const dataInicio = new Date(inicio + "T00:00:00");
      const dataFim = new Date(fim + "T23:59:59");
      
      const agendamentosResult = await db.select({
        funcionarioId: agendamentos.funcionarioId,
        dataHora: agendamentos.dataHora,
        dataHoraFim: agendamentos.dataHoraFim
      }).from(agendamentos)
        .where(and(
          eq(agendamentos.empresaId, empresa.id),
          inArray(agendamentos.funcionarioId, funcionarioIds),
          gte(agendamentos.dataHora, dataInicio),
          lte(agendamentos.dataHora, dataFim),
          ne(agendamentos.status, "cancelado")
        ));
      
      // Agrupar por funcionário e data
      const agendamentosFormatados = agendamentosResult.map(ag => ({
        funcionario_id: ag.funcionarioId,
        inicio: ag.dataHora,
        fim: ag.dataHoraFim
      }));
      
      res.json({
        inicio,
        fim,
        horario_abertura: empresa.horarioAbertura,
        horario_fechamento: empresa.horarioFechamento,
        agendamentos: agendamentosFormatados
      });
    } catch (error) {
      console.error("Erro buscar agenda semana:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // POST: Criar agendamento público (landing page)
  app.post("/api/public/agendamentos", agendamentoLimiter, async (req, res) => {
    try {
      const { 
        slug, 
        funcionario_id, 
        servico_id, 
        data_hora,
        cliente_nome,
        cliente_telefone,
        cliente_email,
        observacoes
      } = req.body;
      
      // Validações básicas
      if (!slug || !funcionario_id || !servico_id || !data_hora || !cliente_nome || !cliente_telefone) {
        return res.status(400).json({ error: "Campos obrigatórios: slug, funcionario_id, servico_id, data_hora, cliente_nome, cliente_telefone" });
      }
      
      // Validar email se fornecido
      if (cliente_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente_email)) {
        return res.status(400).json({ error: "Email inválido" });
      }
      
      // Sanitizar inputs
      const nomeCliente = cliente_nome.trim().substring(0, 100);
      const telefoneCliente = cliente_telefone.replace(/\D/g, '').substring(0, 15);
      const emailCliente = cliente_email?.trim().toLowerCase().substring(0, 100);
      
      // Verificar se empresa existe
      const empresaResult = await db.select().from(empresas)
        .where(and(eq(empresas.slug, slug), eq(empresas.ativo, true)))
        .limit(1);
      
      if (empresaResult.length === 0) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }
      
      const empresa = empresaResult[0];
      
      // Verificar se funcionário pertence à empresa
      const funcionarioResult = await db.select().from(funcionarios)
        .where(and(
          eq(funcionarios.id, funcionario_id),
          eq(funcionarios.empresaId, empresa.id),
          eq(funcionarios.ativo, true)
        ))
        .limit(1);
      
      if (funcionarioResult.length === 0) {
        return res.status(404).json({ error: "Funcionário não encontrado" });
      }
      
      const funcionario = funcionarioResult[0];
      
      // Verificar se serviço pertence à empresa
      const servicoResult = await db.select().from(servicos)
        .where(and(
          eq(servicos.id, servico_id),
          eq(servicos.empresaId, empresa.id),
          eq(servicos.ativo, true)
        ))
        .limit(1);
      
      if (servicoResult.length === 0) {
        return res.status(404).json({ error: "Serviço não encontrado" });
      }
      
      const servico = servicoResult[0];
      
      // Calcular horário de fim
      const dataHoraInicio = new Date(data_hora);
      const dataHoraFim = new Date(dataHoraInicio.getTime() + servico.duracaoMinutos * 60000);
      
      // Verificar conflito de horário
      const conflito = await db.select().from(agendamentos)
        .where(and(
          eq(agendamentos.funcionarioId, funcionario_id),
          eq(agendamentos.empresaId, empresa.id),
          ne(agendamentos.status, "cancelado"),
          // Verifica sobreposição de horários
          lte(agendamentos.dataHora, dataHoraFim),
          gte(agendamentos.dataHoraFim, dataHoraInicio)
        ))
        .limit(1);
      
      if (conflito.length > 0) {
        return res.status(409).json({ error: "Horário não disponível. Por favor, escolha outro horário." });
      }
      
      // Buscar ou criar cliente
      let clienteId: string;
      
      if (emailCliente) {
        // Tentar encontrar cliente por email
        const clienteExistente = await db.select().from(clientes)
          .where(and(
            eq(clientes.empresaId, empresa.id),
            eq(clientes.email, emailCliente),
            eq(clientes.ativo, true)
          ))
          .limit(1);
        
        if (clienteExistente.length > 0) {
          clienteId = clienteExistente[0].id;
          // Atualizar telefone se necessário
          if (clienteExistente[0].telefone !== telefoneCliente) {
            await db.update(clientes).set({ telefone: telefoneCliente })
              .where(eq(clientes.id, clienteId));
          }
        } else {
          // VALIDAR UNICIDADE GLOBAL antes de criar cliente
          const emailCheck = await checkGlobalUniqueness({
            field: 'email',
            value: emailCliente,
            excludeTable: 'clientes',
            empresaId: empresa.id
          });
          
          if (emailCheck.exists) {
            const tabela = emailCheck.table === 'empresas' ? 'uma empresa' : 
                           emailCheck.table === 'usuarios' ? 'um usuário' : 'um funcionário';
            return res.status(409).json({ 
              error: "email_conflict",
              message: `Este email já está cadastrado em ${tabela}${emailCheck.nome ? ` (${emailCheck.nome})` : ''}. Faça login na área administrativa.`,
              redirect_login: emailCheck.table === 'empresas' || emailCheck.table === 'usuarios'
            });
          }
          
          // Validar telefone também
          const telefoneCheck = await checkGlobalUniqueness({
            field: 'telefone',
            value: telefoneCliente,
            excludeTable: 'clientes',
            empresaId: empresa.id
          });
          
          if (telefoneCheck.exists) {
            const tabela = telefoneCheck.table === 'empresas' ? 'uma empresa' : 'um funcionário';
            return res.status(409).json({ 
              error: "telefone_conflict",
              message: `Este telefone já está cadastrado em ${tabela}${telefoneCheck.nome ? ` (${telefoneCheck.nome})` : ''}.`
            });
          }
          
          // Criar novo cliente
          const novoCliente = await db.insert(clientes).values({
            empresaId: empresa.id,
            nome: nomeCliente,
            telefone: telefoneCliente,
            email: emailCliente,
            ativo: true
          }).returning();
          clienteId = novoCliente[0].id;
        }
      } else {
        // Tentar encontrar por telefone
        const clienteExistente = await db.select().from(clientes)
          .where(and(
            eq(clientes.empresaId, empresa.id),
            eq(clientes.telefone, telefoneCliente),
            eq(clientes.ativo, true)
          ))
          .limit(1);
        
        if (clienteExistente.length > 0) {
          clienteId = clienteExistente[0].id;
        } else {
          // VALIDAR UNICIDADE GLOBAL antes de criar cliente
          const telefoneCheck = await checkGlobalUniqueness({
            field: 'telefone',
            value: telefoneCliente,
            excludeTable: 'clientes',
            empresaId: empresa.id
          });
          
          if (telefoneCheck.exists) {
            const tabela = telefoneCheck.table === 'empresas' ? 'uma empresa' : 'um funcionário';
            return res.status(409).json({ 
              error: "telefone_conflict",
              message: `Este telefone já está cadastrado em ${tabela}${telefoneCheck.nome ? ` (${telefoneCheck.nome})` : ''}.`
            });
          }
          
          // Criar novo cliente
          const novoCliente = await db.insert(clientes).values({
            empresaId: empresa.id,
            nome: nomeCliente,
            telefone: telefoneCliente,
            ativo: true
          }).returning();
          clienteId = novoCliente[0].id;
        }
      }
      
      // Criar agendamento
      const novoAgendamento = await db.insert(agendamentos).values({
        empresaId: empresa.id,
        clienteId,
        funcionarioId: funcionario_id,
        servicoId: servico_id,
        dataHora: dataHoraInicio,
        dataHoraFim,
        observacoes: observacoes?.trim().substring(0, 500),
        precoFinal: servico.preco,
        status: "agendado"
      }).returning();
      
      // Email de confirmação será enviado quando o estabelecimento confirmar o agendamento
      // (via PATCH /api/agendamentos/:id com status = "confirmado")
      
      res.status(201).json({
        success: true,
        agendamento: {
          id: novoAgendamento[0].id,
          data_hora: dataHoraInicio,
          data_hora_fim: dataHoraFim,
          servico: servico.nome,
          funcionario: funcionario.nome,
          status: "agendado"
        }
      });
    } catch (error) {
      console.error("Erro criar agendamento público:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // ============ API PÚBLICA: ENVIAR CÓDIGO DE VERIFICAÇÃO ============
  app.post("/api/public/enviar-codigo/:slug", verificacaoLimiter, async (req, res) => {
    try {
      const { slug } = req.params;
      const { email } = req.body;
      
      if (!slug || !email) {
        return res.status(400).json({ error: "Slug e email são obrigatórios" });
      }
      
      const emailStr = String(email).toLowerCase().trim();
      if (!emailStr.includes('@') || emailStr.length < 5) {
        return res.status(400).json({ error: "Email inválido" });
      }
      
      // VERIFICAR SE É EMAIL DE EMPRESA OU USUÁRIO ANTES DE PROSSEGUIR
      // Se for email de empresa, redirecionar para login (case-insensitive)
      const empresaComEmail = await db.select({ id: empresas.id, nome: empresas.nome })
        .from(empresas)
        .where(and(sql`LOWER(${empresas.email}) = ${emailStr}`, eq(empresas.ativo, true)))
        .limit(1);
      
      if (empresaComEmail.length > 0) {
        return res.status(403).json({ 
          error: "email_empresa",
          message: `Este email pertence à empresa "${empresaComEmail[0].nome}". Faça login na área administrativa.`,
          empresa_nome: empresaComEmail[0].nome,
          redirect_login: true
        });
      }
      
      // Verificar se é email de usuário administrativo
      const usuarioComEmail = await db.select({ id: usuarios.id, nome: usuarios.nome })
        .from(usuarios)
        .where(sql`LOWER(${usuarios.email}) = ${emailStr}`)
        .limit(1);
      
      if (usuarioComEmail.length > 0) {
        return res.status(403).json({ 
          error: "email_usuario",
          message: "Este email pertence a uma conta administrativa. Faça login na área administrativa.",
          redirect_login: true
        });
      }
      
      // Buscar empresa pelo slug
      const empresa = await db.select().from(empresas).where(
        and(eq(empresas.slug, slug), eq(empresas.ativo, true))
      ).limit(1);
      
      if (empresa.length === 0) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }
      
      // Buscar cliente pelo email na empresa
      const cliente = await db.select().from(clientes).where(
        and(eq(clientes.empresaId, empresa[0].id), eq(clientes.email, emailStr))
      ).limit(1);
      
      if (cliente.length === 0) {
        // Retornar sucesso mesmo se não encontrar para não revelar se o email existe
        // Mas não enviar email de verdade
        return res.json({ 
          success: true,
          message: "Se houver agendamentos para este email, você receberá um código de verificação"
        });
      }
      
      // Gerar código e token
      const codigo = gerarCodigoVerificacao();
      const token = gerarTokenVerificacao();
      
      // Salvar verificação
      verificacoesAtivas.set(token, {
        codigo,
        email: emailStr,
        empresaId: empresa[0].id,
        clienteId: cliente[0].id,
        criadoEm: Date.now(),
        tentativas: 0
      });
      
      // Enviar email com código usando Resend
      let emailEnviado = false;
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API);
        
        const emailResult = await resend.emails.send({
          from: 'Livegenda <noreply@livegenda.com>',
          to: emailStr,
          subject: `Seu código de verificação - ${empresa[0].nome}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #7c3aed;">Código de Verificação</h2>
              <p>Olá ${cliente[0].nome},</p>
              <p>Você solicitou acesso aos seus agendamentos em <strong>${empresa[0].nome}</strong>.</p>
              <p>Use o código abaixo para verificar seu email:</p>
              <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #7c3aed;">${codigo}</span>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Este código expira em 10 minutos.</p>
              <p style="color: #6b7280; font-size: 14px;">Se você não solicitou este código, ignore este email.</p>
            </div>
          `
        });
        console.log("Email OTP enviado:", emailResult);
        emailEnviado = !emailResult.error;
        if (emailResult.error) {
          console.error("Erro Resend:", emailResult.error);
        }
      } catch (emailError) {
        console.error("Erro ao enviar email de verificação:", emailError);
      }
      
      // Enviar SMS com código se cliente tiver telefone
      let smsEnviado = false;
      if (cliente[0].telefone) {
        try {
          const smsResult = await sendOtpSms({
            to: cliente[0].telefone,
            codigo,
            empresaNome: empresa[0].nome
          });
          console.log("SMS OTP enviado:", smsResult);
          smsEnviado = smsResult.success;
        } catch (smsError) {
          console.error("Erro ao enviar SMS de verificação:", smsError);
        }
      }
      
      // Log para debug em desenvolvimento
      if (!emailEnviado && !smsEnviado) {
        console.log(`[DEV] Código OTP para ${emailStr}: ${codigo}`);
      }
      
      res.json({ 
        success: true,
        token,
        message: "Se houver agendamentos para este email, você receberá um código de verificação"
      });
    } catch (error) {
      console.error("Erro enviar código verificação:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // ============ API PÚBLICA: VALIDAR CÓDIGO DE VERIFICAÇÃO ============
  app.post("/api/public/validar-codigo", publicApiLimiter, async (req, res) => {
    try {
      const { token, codigo } = req.body;
      
      if (!token || !codigo) {
        return res.status(400).json({ error: "Token e código são obrigatórios" });
      }
      
      const verificacao = verificacoesAtivas.get(token);
      
      if (!verificacao) {
        return res.status(400).json({ error: "Token inválido ou expirado" });
      }
      
      // Verificar expiração
      if (Date.now() - verificacao.criadoEm > VERIFICACAO_EXPIRACAO_MS) {
        verificacoesAtivas.delete(token);
        return res.status(400).json({ error: "Código expirado. Solicite um novo." });
      }
      
      // Verificar tentativas
      if (verificacao.tentativas >= MAX_TENTATIVAS) {
        verificacoesAtivas.delete(token);
        return res.status(400).json({ error: "Muitas tentativas. Solicite um novo código." });
      }
      
      // Verificar código
      if (verificacao.codigo !== codigo) {
        verificacao.tentativas++;
        return res.status(400).json({ 
          error: "Código incorreto",
          tentativas_restantes: MAX_TENTATIVAS - verificacao.tentativas
        });
      }
      
      // Código correto - gerar novo token de acesso
      const tokenAcesso = gerarTokenVerificacao() + gerarTokenVerificacao();
      
      // Atualizar verificação com token de acesso
      verificacoesAtivas.set(tokenAcesso, {
        ...verificacao,
        codigo: 'VERIFICADO',
        criadoEm: Date.now() // Renovar tempo de expiração
      });
      
      // Remover token antigo
      verificacoesAtivas.delete(token);
      
      // Buscar nome do cliente
      const cliente = await db.select().from(clientes).where(eq(clientes.id, verificacao.clienteId)).limit(1);
      
      res.json({
        success: true,
        token_acesso: tokenAcesso,
        cliente: {
          nome: cliente[0]?.nome || 'Cliente',
          email: verificacao.email
        }
      });
    } catch (error) {
      console.error("Erro validar código:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // ============ API PÚBLICA: CONSULTAR AGENDAMENTOS POR EMAIL (COM VERIFICAÇÃO) ============
  app.get("/api/public/meus-agendamentos/:slug", publicApiLimiter, async (req, res) => {
    try {
      const { slug } = req.params;
      const { token_acesso } = req.query;
      
      if (!slug || !token_acesso) {
        return res.status(400).json({ error: "Slug e token de acesso são obrigatórios" });
      }
      
      // Verificar token de acesso
      const tokenStr = String(token_acesso);
      const verificacao = verificacoesAtivas.get(tokenStr);
      
      if (!verificacao || verificacao.codigo !== 'VERIFICADO') {
        return res.status(401).json({ error: "Token inválido ou não verificado. Solicite um novo código." });
      }
      
      // Verificar expiração
      if (Date.now() - verificacao.criadoEm > VERIFICACAO_EXPIRACAO_MS) {
        verificacoesAtivas.delete(tokenStr);
        return res.status(401).json({ error: "Sessão expirada. Solicite um novo código." });
      }
      
      // Buscar empresa pelo slug e verificar se bate com a verificação
      const empresa = await db.select().from(empresas).where(
        and(eq(empresas.slug, slug), eq(empresas.ativo, true))
      ).limit(1);
      
      if (empresa.length === 0) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }
      
      if (empresa[0].id !== verificacao.empresaId) {
        return res.status(403).json({ error: "Token não válido para esta empresa" });
      }
      
      // Buscar cliente pelo ID da verificação
      const cliente = await db.select().from(clientes).where(
        eq(clientes.id, verificacao.clienteId)
      ).limit(1);
      
      if (cliente.length === 0) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      
      // Buscar agendamentos do cliente (apenas futuros ou recentes - últimos 30 dias)
      const hoje = new Date();
      const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const agendamentosResult = await db.select()
        .from(agendamentos)
        .where(
          and(
            eq(agendamentos.clienteId, cliente[0].id),
            eq(agendamentos.empresaId, empresa[0].id),
            gte(agendamentos.dataHora, trintaDiasAtras),
            ne(agendamentos.status, 'cancelado')
          )
        )
        .orderBy(agendamentos.dataHora);
      
      // Buscar dados relacionados
      const agendamentosComDados = await Promise.all(
        agendamentosResult.map(async (ag) => {
          const funcionario = await db.select().from(funcionarios).where(eq(funcionarios.id, ag.funcionarioId)).limit(1);
          const servico = await db.select().from(servicos).where(eq(servicos.id, ag.servicoId)).limit(1);
          
          // Calcular duração em minutos
          const duracaoMs = ag.dataHoraFim.getTime() - ag.dataHora.getTime();
          const duracaoMinutos = Math.round(duracaoMs / (1000 * 60));
          
          // Retornar no mesmo formato que o endpoint privado (ISO strings)
          // O frontend vai transformar usando o timezone do navegador do usuário
          return {
            id: ag.id,
            data_hora: ag.dataHora,  // Date object → Express serializa como ISO UTC
            data_hora_fim: ag.dataHoraFim,  // Date object → Express serializa como ISO UTC
            duracao_minutos: duracaoMinutos,
            status: ag.status,
            observacoes: ag.observacoes,
            cliente_id: ag.clienteId,
            funcionario_id: ag.funcionarioId,
            servico_id: ag.servicoId,
            empresa_id: ag.empresaId,
            funcionario: funcionario[0] ? {
              id: funcionario[0].id,
              nome: funcionario[0].nome
            } : null,
            servico: servico[0] ? {
              id: servico[0].id,
              nome: servico[0].nome,
              preco: servico[0].preco,
              duracao_minutos: servico[0].duracaoMinutos
            } : null
          };
        })
      );
      
      res.json({
        cliente: {
          nome: cliente[0].nome,
          email: cliente[0].email
        },
        agendamentos: agendamentosComDados
      });
    } catch (error) {
      console.error("Erro buscar agendamentos por email:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // ============ API PÚBLICA: ALTERAR/CANCELAR AGENDAMENTO ============
  app.patch("/api/public/agendamentos/:id", publicApiLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const { token_acesso, acao, nova_data, nova_hora, novo_funcionario_id, observacoes } = req.body;
      
      if (!id || !token_acesso) {
        return res.status(400).json({ error: "ID do agendamento e token de acesso são obrigatórios" });
      }
      
      // Verificar token de acesso
      const tokenStr = String(token_acesso);
      const verificacao = verificacoesAtivas.get(tokenStr);
      
      if (!verificacao || verificacao.codigo !== 'VERIFICADO') {
        return res.status(401).json({ error: "Token inválido ou não verificado. Solicite um novo código." });
      }
      
      // Verificar expiração
      if (Date.now() - verificacao.criadoEm > VERIFICACAO_EXPIRACAO_MS) {
        verificacoesAtivas.delete(tokenStr);
        return res.status(401).json({ error: "Sessão expirada. Solicite um novo código." });
      }
      
      // Buscar agendamento
      const agendamento = await db.select().from(agendamentos).where(eq(agendamentos.id, id)).limit(1);
      
      if (agendamento.length === 0) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }
      
      // Verificar se o agendamento pertence ao cliente verificado
      if (agendamento[0].clienteId !== verificacao.clienteId) {
        return res.status(403).json({ error: "Você não tem permissão para alterar este agendamento" });
      }
      
      // Verificar se o agendamento é da mesma empresa
      if (agendamento[0].empresaId !== verificacao.empresaId) {
        return res.status(403).json({ error: "Agendamento não pertence a esta empresa" });
      }
      
      // Verificar se agendamento ainda pode ser alterado (não cancelado e data futura)
      const agora = new Date();
      if (agendamento[0].status === 'cancelado') {
        return res.status(400).json({ error: "Agendamento já cancelado" });
      }
      
      if (agendamento[0].dataHora < agora) {
        return res.status(400).json({ error: "Não é possível alterar agendamentos passados" });
      }
      
      // Ação: cancelar
      if (acao === 'cancelar') {
        const result = await db.update(agendamentos)
          .set({ status: 'cancelado' })
          .where(eq(agendamentos.id, id))
          .returning();
        
        return res.json({
          success: true,
          message: "Agendamento cancelado com sucesso",
          agendamento: convertToSnakeCase(result[0])
        });
      }
      
      // Ação: remarcar
      if (acao === 'remarcar') {
        if (!nova_data || !nova_hora) {
          return res.status(400).json({ error: "Nova data e hora são obrigatórios para remarcar" });
        }
        
        // Validar data futura
        const novaDataHora = new Date(`${nova_data}T${nova_hora}:00`);
        if (novaDataHora < agora) {
          return res.status(400).json({ error: "Data e hora devem ser futuras" });
        }
        
        // Usar funcionário atual ou novo
        const funcionarioId = novo_funcionario_id || agendamento[0].funcionarioId;
        
        // Buscar serviço para obter duração
        const servico = await db.select().from(servicos).where(eq(servicos.id, agendamento[0].servicoId)).limit(1);
        
        if (servico.length === 0) {
          return res.status(400).json({ error: "Serviço não encontrado" });
        }
        
        // Calcular hora fim usando a duração do serviço
        const duracaoMinutos = servico[0].duracaoMinutos;
        const novaDataHoraFim = new Date(novaDataHora.getTime() + duracaoMinutos * 60 * 1000);
        
        // Verificar conflito de horário
        const conflito = await db.select().from(agendamentos).where(
          and(
            eq(agendamentos.funcionarioId, funcionarioId),
            ne(agendamentos.id, id),
            ne(agendamentos.status, 'cancelado'),
            sql`(
              ${agendamentos.dataHora} < ${novaDataHoraFim} AND ${agendamentos.dataHoraFim} > ${novaDataHora}
            )`
          )
        );
        
        if (conflito.length > 0) {
          return res.status(409).json({ error: "Horário não disponível" });
        }
        
        // Atualizar agendamento
        const result = await db.update(agendamentos)
          .set({
            dataHora: novaDataHora,
            dataHoraFim: novaDataHoraFim,
            funcionarioId,
            observacoes: observacoes || agendamento[0].observacoes,
            status: 'agendado' // Volta para agendado após remarcar
          })
          .where(eq(agendamentos.id, id))
          .returning();
        
        return res.json({
          success: true,
          message: "Agendamento remarcado com sucesso",
          agendamento: convertToSnakeCase(result[0])
        });
      }
      
      // Ação não reconhecida
      return res.status(400).json({ error: "Ação inválida. Use 'cancelar' ou 'remarcar'" });
    } catch (error) {
      console.error("Erro alterar agendamento:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  // ============ API PÚBLICA: BUSCAR SERVIÇOS PRÓXIMOS ============
  // Busca empresas ativas com serviços, ordenadas por proximidade
  app.get("/api/public/buscar-servicos", publicApiLimiter, async (req, res) => {
    try {
      const { lat, lng, categoria, raio_km, termo } = req.query;
      
      // Raio padrão: 25km, máximo: 100km
      const raioKm = Math.min(Number(raio_km) || 25, 100);
      
      // Buscar empresas ativas com endereço completo
      let conditions: any[] = [
        eq(empresas.ativo, true),
        eq(empresas.enderecoCompleto, true)
      ];
      
      // Filtro por categoria
      if (categoria && typeof categoria === 'string') {
        const categoriasValidas = ['salao_beleza', 'barbearia', 'clinica_estetica'];
        if (categoriasValidas.includes(categoria)) {
          conditions.push(eq(empresas.categoria, categoria as any));
        }
      }
      
      const empresasResult = await db.select().from(empresas).where(and(...conditions));
      
      // Buscar serviços de cada empresa
      const empresasComServicos = await Promise.all(
        empresasResult.map(async (empresa) => {
          const servicosEmpresa = await db.select()
            .from(servicos)
            .where(and(eq(servicos.empresaId, empresa.id), eq(servicos.ativo, true)));
          
          // Filtro por termo de busca nos serviços
          let servicosFiltrados = servicosEmpresa;
          if (termo && typeof termo === 'string' && termo.trim()) {
            const termoLower = termo.toLowerCase().trim();
            servicosFiltrados = servicosEmpresa.filter(s => 
              s.nome.toLowerCase().includes(termoLower) ||
              (s.descricao && s.descricao.toLowerCase().includes(termoLower))
            );
          }
          
          // Se tem termo de busca e nenhum serviço corresponde, ignorar empresa
          if (termo && servicosFiltrados.length === 0) {
            return null;
          }
          
          return {
            ...convertToSnakeCase(empresa),
            servicos: convertToSnakeCase(servicosFiltrados),
            total_servicos: servicosEmpresa.length
          };
        })
      );
      
      // Filtrar empresas nulas (que não têm serviços correspondentes)
      let empresasFiltradas = empresasComServicos.filter(e => e !== null);
      
      // Calcular distância se coordenadas do usuário foram fornecidas
      if (lat && lng) {
        const userLat = parseFloat(lat as string);
        const userLng = parseFloat(lng as string);
        
        if (!isNaN(userLat) && !isNaN(userLng)) {
          empresasFiltradas = empresasFiltradas
            .map(empresa => {
              // Calcular distância usando fórmula de Haversine
              if (empresa.latitude && empresa.longitude) {
                const distancia = calcularDistanciaKm(
                  userLat, userLng,
                  empresa.latitude, empresa.longitude
                );
                return { ...empresa, distancia_km: Math.round(distancia * 10) / 10 };
              }
              // Empresas sem coordenadas ficam com distância indefinida
              return { ...empresa, distancia_km: null };
            })
            // Filtrar por raio
            .filter(e => e.distancia_km === null || e.distancia_km <= raioKm)
            // Ordenar por distância (empresas sem coordenadas por último)
            .sort((a, b) => {
              if (a.distancia_km === null) return 1;
              if (b.distancia_km === null) return -1;
              return a.distancia_km - b.distancia_km;
            });
        }
      }
      
      // Limitar resultados (máximo 50)
      const resultados = empresasFiltradas.slice(0, 50);
      
      res.json({
        total: resultados.length,
        raio_km: raioKm,
        empresas: resultados
      });
    } catch (error) {
      console.error("Erro buscar serviços:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });
  
  // Listar categorias de serviços disponíveis (dinâmico baseado nas empresas existentes)
  app.get("/api/public/categorias", publicApiLimiter, async (req, res) => {
    try {
      // Mapeamento de categorias para labels legíveis
      const categoriasLabels: Record<string, { label: string; icone: string }> = {
        'salao_beleza': { label: 'Salão de Beleza', icone: 'scissors' },
        'barbearia': { label: 'Barbearia', icone: 'scissors' },
        'clinica_estetica': { label: 'Clínica de Estética', icone: 'sparkles' },
        'consultoria': { label: 'Consultoria', icone: 'briefcase' },
        'saude': { label: 'Saúde', icone: 'heart' },
        'educacao': { label: 'Educação', icone: 'book' },
        'pet_shop': { label: 'Pet Shop', icone: 'paw' },
        'academia': { label: 'Academia', icone: 'dumbbell' },
        'spa': { label: 'Spa', icone: 'sparkles' },
        'outro': { label: 'Outro', icone: 'building' }
      };

      // Buscar categorias distintas das empresas ativas
      const empresasAtivas = await db.select({ categoria: empresas.categoria })
        .from(empresas)
        .where(eq(empresas.ativo, true));
      
      // Obter categorias únicas
      const categoriasSet = new Set(empresasAtivas.map(e => e.categoria).filter(Boolean));
      const categoriasUnicas = Array.from(categoriasSet);
      
      // Mapear para o formato de resposta
      const categorias = categoriasUnicas.map(cat => ({
        value: cat,
        label: categoriasLabels[cat]?.label || cat.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        icone: categoriasLabels[cat]?.icone || 'building'
      }));

      res.json(categorias);
    } catch (error) {
      console.error("Erro listar categorias:", error);
      res.status(500).json({ error: "Erro interno" });
    }
  });

  return httpServer;
}

// Função auxiliar: Calcular distância em km usando fórmula de Haversine
function calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
