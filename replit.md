# Livegenda - Sistema de Agendamento SaaS

## Overview

Livegenda é um sistema SaaS multi-tenant de agendamento para salões de beleza, barbearias e clínicas de estética. A aplicação utiliza arquitetura moderna otimizada para custo zero, com foco em WhatsApp Business para agendamento inteligente.

**Idioma:** Português (pt-BR)
**Comunicação:** Linguagem simples e direta

## Arquitetura de Deploy

### Ambiente Atual: Cloudflare + Neon (Custo $0)

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE                                 │
│  ┌─────────────────────┐              ┌─────────────────────┐   │
│  │  CLOUDFLARE PAGES   │              │  PAGES FUNCTIONS    │   │
│  │  (Frontend React)   │              │  (API Backend)      │   │
│  │  - livegenda.com    │              │  - /api/*           │   │
│  │  - app.livegenda.com│              │  - 100k req/dia     │   │
│  └─────────────────────┘              └───────────┬─────────┘   │
└───────────────────────────────────────────────────┼─────────────┘
                                                    │
                              ┌─────────────────────▼───────────┐
                              │         NEON PostgreSQL         │
                              │         0.5GB storage           │
                              └─────────────────────────────────┘
```

### Deploy & CI/CD

| Branch | Ambiente | URL |
|--------|----------|-----|
| `master` | Produção | app.livegenda.com |
| PR | Preview | pr-xxx.livegenda.pages.dev |

**Deploy automático via Cloudflare Pages:**
- Push no GitHub → Build automático → Deploy
- Projeto Cloudflare: `new-livegenda`
- Build caching: desabilitado

### Migração Futura: GCP

Configuração documentada em `gcp-config.json`. Migrar quando:
- 50+ empresas ativas
- 0.5GB+ de dados
- Latência < 10ms necessária

## Stack Tecnológico

### Frontend
- **React 18** + JavaScript + Vite
- **React Router DOM** para routing
- **shadcn/ui** + Radix UI + Tailwind CSS
- **Design:** New York style, paleta neutra

### Backend
- **Cloudflare Pages Functions** (edge)
- **Neon PostgreSQL** (serverless)
- **Drizzle ORM** para type-safe queries

### Banco de Dados

**Schema Multi-tenant (empresa_id em todas tabelas):**

| Tabela | Descrição |
|--------|-----------|
| `empresas` | Tenants (salões, barbearias, clínicas) |
| `usuarios` | Usuários de login |
| `funcionarios` | Profissionais que atendem |
| `clientes` | Clientes das empresas |
| `servicos` | Serviços oferecidos |
| `servicos_funcionarios` | Relação N:N serviços ↔ funcionários |
| `agendamentos` | Agendamentos marcados |

## Estrutura de Arquivos

```
livegenda-app/
├── src/                     # Frontend React (USADO PELO BUILD)
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── agendamento/     # Componentes de agendamento
│   │   ├── clientes/        # Componentes de clientes
│   │   └── configuracoes/   # Componentes de configurações
│   ├── pages/               # Páginas da aplicação
│   │   ├── Login.jsx        # Tela de login
│   │   ├── Dashboard.jsx    # Dashboard principal
│   │   ├── Agendamentos.jsx # Agenda
│   │   └── ...              # Outras páginas
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities
│   ├── api/                 # Clients de API
│   ├── App.jsx              # Router principal
│   ├── main.jsx             # Entry point
│   └── index.css            # Estilos globais
│
├── functions/               # Cloudflare Pages Functions (API)
│   └── api/
│       ├── _middleware.ts   # CORS, Auth, Error handling
│       ├── health.ts        # Health check
│       ├── auth/            # Autenticação
│       ├── empresas/        # CRUD empresas
│       ├── clientes/        # CRUD clientes
│       ├── funcionarios/    # CRUD funcionários
│       ├── servicos/        # CRUD serviços
│       └── agendamentos/    # CRUD agendamentos
│
├── server/                  # Backend Express (dev local Replit)
│   ├── db.ts                # Conexão Neon
│   └── routes.ts            # Rotas Express
│
├── shared/
│   ├── schema.ts            # Drizzle schema + Zod types
│   └── lib/                 # Módulos compartilhados
│       ├── index.ts         # Exports centralizados
│       ├── db/              # Database clients
│       │   ├── types.ts     # Interface DbClient
│       │   └── drizzle-client.ts  # Implementação Drizzle
│       ├── runtime/         # Adapters por runtime
│       │   └── types.ts     # EnvConfig interface
│       ├── services/        # Services (email, SMS)
│       │   ├── email.ts     # Email via Resend
│       │   └── sms.ts       # SMS via Infobip
│       └── use-cases/       # Orquestradores
│           ├── agendamentos.ts  # CRUD + notificações
│           └── funcionarios.ts  # CRUD + notificações
│
├── apps/landing/            # Landing page estática
├── public/                  # Arquivos estáticos
├── index.html               # Entry point HTML
├── vite.config.js           # Config Vite
├── tailwind.config.js       # Config Tailwind
├── wrangler.toml            # Config Cloudflare Workers
└── replit.md                # Este arquivo
```

## APIs REST

### Endpoints Disponíveis

```
GET    /api/health              # Status da API
GET    /api/empresas            # Listar empresas
POST   /api/empresas            # Criar empresa
GET    /api/empresas/:id        # Buscar empresa
PUT    /api/empresas/:id        # Atualizar empresa
DELETE /api/empresas/:id        # Desativar empresa

GET    /api/clientes?empresa_id=  # Listar clientes
POST   /api/clientes              # Criar cliente
GET    /api/clientes/:id          # Buscar cliente
PUT    /api/clientes/:id          # Atualizar cliente
DELETE /api/clientes/:id          # Desativar cliente

GET    /api/funcionarios?empresa_id=  # Listar funcionários
POST   /api/funcionarios              # Criar funcionário
GET    /api/funcionarios/:id          # Buscar funcionário
PUT    /api/funcionarios/:id          # Atualizar funcionário
DELETE /api/funcionarios/:id          # Desativar funcionário

GET    /api/servicos?empresa_id=  # Listar serviços
POST   /api/servicos              # Criar serviço
GET    /api/servicos/:id          # Buscar serviço
PUT    /api/servicos/:id          # Atualizar serviço
DELETE /api/servicos/:id          # Desativar serviço

GET    /api/agendamentos?empresa_id=  # Listar agendamentos
POST   /api/agendamentos              # Criar agendamento
GET    /api/agendamentos/:id          # Buscar agendamento
PUT    /api/agendamentos/:id          # Atualizar agendamento
PATCH  /api/agendamentos/:id          # Atualizar status
DELETE /api/agendamentos/:id          # Cancelar agendamento
```

## Comandos de Desenvolvimento

```bash
# Desenvolvimento local
npm run dev

# Build para produção
npm run build

# Type check
npm run check

# Push schema para banco
npm run db:push
```

## Variáveis de Ambiente

### Desenvolvimento (Replit)
Já configuradas automaticamente via secrets.

### Produção (Cloudflare)
```
DATABASE_URL          # Connection string Neon
JWT_SECRET            # Secret para tokens
VITE_API_URL          # URL da API
```

## Decisões Técnicas

1. **Cloudflare over GCP:** Custo zero, edge global, deploy automático
2. **Neon over Cloud SQL:** Serverless, scale-to-zero, free tier generoso
3. **Pages Functions over Workers:** Integração mais simples com Pages
4. **Drizzle over Prisma:** Mais leve, melhor para edge functions
5. **Multi-tenant via empresa_id:** Simples, escalável, seguro

## Limites Free Tier

| Serviço | Limite |
|---------|--------|
| Cloudflare Pages | Ilimitado |
| Cloudflare Workers | 100k req/dia |
| Neon Storage | 0.5 GB |
| Neon Compute | 191h/mês |

## Preferências do Usuário

### Controle de Custos (OBRIGATÓRIO)
**Antes de iniciar qualquer tarefa que envolva custos:**
1. Calcular e apresentar o custo estimado da tarefa
2. Aguardar aprovação se o custo for significativo
3. Ao finalizar, reportar o custo real gasto

**Tipos de custos a considerar:**
- APIs externas pagas (OpenAI, Twilio, etc.)
- Serviços de nuvem além do free tier
- Integrações com serviços pagos
- **Créditos do Replit (builds, execução, etc.)**

**Custos Replit a monitorar:**
- Builds e compilações
- Tempo de execução do servidor
- Uso de recursos (CPU/memória)

**Formato do relatório:**
```
💰 ESTIMATIVA DE CUSTO
├── [Serviço]: $X.XX/mês ou $X.XX/uso
├── [Serviço]: $X.XX/mês ou $X.XX/uso
└── Total estimado: $X.XX

💰 CUSTO REALIZADO (ao final)
├── [O que foi usado]: $X.XX
└── Total gasto: $X.XX
```

### Fluxo de Trabalho (OBRIGATÓRIO)
**Após cada commit para produção:**
1. SEMPRE testar em produção usando https://app.livegenda.com
2. NÃO testar no ambiente local do Replit (desperdiça créditos)
3. Usar GitHub API para criar/editar arquivos (repositório: guirofeoli/livegenda-app)
4. Cloudflare Pages faz deploy automático via GitHub push

**IMPORTANTE - Testes:**
- NUNCA usar máquina interna para testes
- Quando pedir para testar: abrir browser e digitar app.livegenda.com ou livegenda.com
- Testar sempre na URL de produção, nunca em ambiente local

**Cloudflare Functions:**
- Usar `context.data` para passar dados do middleware (padrão Cloudflare)
- Arquivos ficam em `functions/api/`
- Middleware em `functions/api/_middleware.ts`
- Functions usam módulos compartilhados de `shared/lib/`
- Use-cases orquestram DB + notificações (email/SMS)

**Arquitetura Shared Modules:**
- `shared/lib/db/` - DbClient interface e implementação Drizzle
- `shared/lib/services/` - Email (Resend) e SMS (Infobip)
- `shared/lib/use-cases/` - Orquestradores que combinam DB + notificações
- Functions criam DbClient via `createDbClient(DATABASE_URL)`
- Mesmos use-cases funcionam no Express e Cloudflare Functions

### Outras Preferências
- Idioma: Português (pt-BR)
- Comunicação: Linguagem simples e direta
- Prioridade: Soluções de custo zero sempre que possível
- Migração: Preparar para GCP/AWS quando escalar

## Upload de Logos

### Funcionamento
- Logos são armazenados no Replit Object Storage
- Path no banco: `/objects/logos/{empresaId}_{timestamp}.{ext}`
- ACL: public (logos são visíveis publicamente)

### Rotas de Objetos
- `/objects/logos/:filename` - Rota direta (porta 3001)
- `/api/objects/logos/:filename` - Rota via proxy (funciona em todas as portas)

### Helper `resolveObjectUrl`
Função em `src/components/LogoUploader.jsx` que resolve URLs de objetos:
- Em localhost: `http://localhost:3001/objects/...`
- Em outros hosts: `/api/objects/...` (usa proxy da API)

### Componente `EmpresaLogo`
- Renderiza logo como `<img>` se existir
- Fallback para iniciais se não houver logo
- Usado em: Dashboard header, Busca, Listagens

## Sistema de Notificações

### Email (Resend)
- Domínio verificado: livegenda.com
- Remetente: noreply@livegenda.com
- Templates no Resend Dashboard

### SMS (Infobip)
- Provedor: Infobip (pay-as-you-go)
- Custo: ~$0.02/SMS para Brasil
- Secrets: `INFOBIP_API`, `INFOBIP_BASE_URL`

### Pontos de Disparo (Email + SMS)
| Evento | Email | SMS |
|--------|-------|-----|
| Boas-vindas funcionário | ✅ se tiver email | ✅ se tiver telefone |
| Confirmação agendamento | ✅ se tiver email | ✅ se tiver telefone |
| Código OTP | ✅ sempre | ✅ se tiver telefone |

### Arquivos
- `server/email.ts` - Funções de email via Resend
- `server/sms.ts` - Funções de SMS via Infobip

## Próximos Passos

1. [ ] Implementar autenticação JWT
2. [ ] Criar frontend da agenda
3. [ ] Integrar WhatsApp Business
4. [ ] Implementar lembretes automáticos
5. [ ] Dashboard de métricas
6. [ ] CRM com réguas de relacionamento (wizard gamificado)
