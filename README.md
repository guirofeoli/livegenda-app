# Livegenda (Atualizado: 2025-12-02 01:30)

Sistema SaaS multi-tenant de agendamento para salões de beleza, barbearias e clínicas de estética.

## Visão Geral

O Livegenda é uma aplicação web focada em otimizar o fluxo de agendamentos e operação diária de estabelecimentos de beleza e bem-estar. Permite que gestores e profissionais organizem horários, cadastrem serviços e clientes, gerenciem a disponibilidade da equipe e reduzam faltas com lembretes automáticos.

**Principais objetivos:**
- Reduzir conflitos de agenda e sobreposição de horários
- Melhorar a taxa de comparecimento com notificações (Email + SMS)
- Facilitar o autoagendamento pelo cliente e agendamento pelo recepcionista
- Dar visibilidade ao dono/gestor por meio de relatórios

## Sitemap

```
livegenda.com                     → Landing page (informações e conversão)
├── /                             → Home com hero, features, pricing
├── /sobre                        → Sobre a empresa
└── /contato                      → Formulário de contato

app.livegenda.com                 → Aplicação principal (autenticada)
├── /login                        → Tela de login
├── /register                     → Cadastro de nova empresa
├── /onboarding                   → Wizard de configuração inicial
├── /dashboard                    → Visão geral do dia/semana
├── /agendamentos                 → Calendário de agendamentos
├── /clientes                     → Lista e cadastro de clientes
├── /funcionarios                 → Gestão de profissionais
├── /servicos                     → Catálogo de serviços
├── /configuracoes                → Configurações da empresa
│   ├── /empresa                  → Dados da empresa
│   ├── /horarios                 → Horários de funcionamento
│   └── /notificacoes             → Preferências de notificações
└── /relatorios                   → Relatórios e analytics

app.livegenda.com/empresa/:slug   → Página pública de agendamento (cliente)
├── /                             → Escolha de serviço e profissional
├── /horarios                     → Seleção de data/hora
└── /confirmar                    → Confirmação via email/telefone
```

## Arquitetura

### Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + Vite + JavaScript |
| UI | TailwindCSS + shadcn/ui (New York style) |
| Roteamento | React Router DOM |
| Estado | React Query (TanStack Query v5) |
| Backend Dev | Express.js (Replit) |
| Backend Prod | Cloudflare Pages Functions |
| Banco de Dados | PostgreSQL (Neon - serverless) |
| ORM | Drizzle ORM |
| Email | Resend API |
| SMS | Infobip API |

### Estrutura de Arquivos

```
livegenda-app/
├── src/                          # Frontend React
│   ├── components/               # Componentes reutilizáveis
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── agendamento/          # Componentes de agendamento
│   │   ├── clientes/             # Componentes de clientes
│   │   └── funcionarios/         # Componentes de funcionários
│   ├── pages/                    # Páginas da aplicação
│   ├── hooks/                    # Custom hooks
│   ├── lib/                      # Utilities
│   └── api/                      # Clients de API
│
├── server/                       # Backend Express (desenvolvimento)
│   ├── db.ts                     # Conexão Neon/Drizzle
│   ├── routes.ts                 # Rotas Express
│   ├── email.ts                  # Serviço de email
│   └── sms.ts                    # Serviço de SMS
│
├── functions/api/                # Cloudflare Pages Functions (produção)
│   ├── _middleware.ts            # CORS, Auth, Error handling
│   ├── lib/                      # Helpers compartilhados
│   ├── agendamentos/             # CRUD agendamentos
│   ├── clientes/                 # CRUD clientes
│   ├── funcionarios/             # CRUD funcionários
│   ├── servicos/                 # CRUD serviços
│   └── empresas/                 # CRUD empresas
│
├── shared/                       # Código compartilhado
│   ├── schema.ts                 # Drizzle schema + Zod types
│   └── lib/                      # Módulos compartilhados
│       ├── runtime/              # Adapters de ambiente
│       ├── db/                   # Cliente de banco abstrato
│       ├── services/             # Email, SMS
│       └── use-cases/            # Lógica de negócio
│
└── apps/landing/                 # Landing page estática
```

## APIs

### APIs Externas Utilizadas

| Serviço | Propósito | Documentação |
|---------|-----------|--------------|
| **Resend** | Envio de emails transacionais | https://resend.com/docs |
| **Infobip** | Envio de SMS | https://www.infobip.com/docs |
| **Neon** | Banco de dados PostgreSQL serverless | https://neon.tech/docs |

### Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL=postgres://...

# Email (Resend)
RESEND_API=re_...

# SMS (Infobip)
INFOBIP_BASE_URL=xxxxx.api.infobip.com
INFOBIP_API=...

# Autenticação
SESSION_SECRET=...
JWT_SECRET=...
```

## API REST - Endpoints

Base URL: `/api`

### Empresas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/empresas` | Listar empresas |
| POST | `/empresas` | Criar empresa |
| GET | `/empresas/:id` | Buscar empresa |
| PUT | `/empresas/:id` | Atualizar empresa |
| DELETE | `/empresas/:id` | Desativar empresa |

**Payload POST /empresas:**
```json
{
  "nome": "Salão Beleza Total",
  "categoria": "salao_beleza",
  "slug": "beleza-total",
  "telefone": "11999999999",
  "email": "contato@belezatotal.com",
  "endereco": "Rua das Flores, 123",
  "cidade": "São Paulo",
  "estado": "SP",
  "cep": "01234-567"
}
```

### Funcionários

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/funcionarios?empresa_id=` | Listar funcionários |
| POST | `/funcionarios` | Criar funcionário (+ email/SMS boas-vindas) |
| GET | `/funcionarios/:id` | Buscar funcionário |
| PUT | `/funcionarios/:id` | Atualizar funcionário |
| DELETE | `/funcionarios/:id` | Desativar funcionário |

**Payload POST /funcionarios:**
```json
{
  "empresa_id": "uuid",
  "nome": "João Silva",
  "cargo": "Cabeleireiro",
  "telefone": "11988888888",
  "email": "joao@email.com",
  "cor": "#8B5CF6",
  "dias_trabalho": ["seg", "ter", "qua", "qui", "sex"],
  "horario_trabalho_inicio": "09:00",
  "horario_trabalho_fim": "18:00"
}
```

### Clientes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/clientes?empresa_id=` | Listar clientes |
| POST | `/clientes` | Criar cliente |
| GET | `/clientes/:id` | Buscar cliente |
| PUT | `/clientes/:id` | Atualizar cliente |
| DELETE | `/clientes/:id` | Desativar cliente |

**Payload POST /clientes:**
```json
{
  "empresa_id": "uuid",
  "nome": "Maria Santos",
  "telefone": "11977777777",
  "email": "maria@email.com",
  "observacoes": "Prefere horários pela manhã"
}
```

### Serviços

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/servicos?empresa_id=` | Listar serviços |
| POST | `/servicos` | Criar serviço |
| GET | `/servicos/:id` | Buscar serviço |
| PUT | `/servicos/:id` | Atualizar serviço |
| DELETE | `/servicos/:id` | Desativar serviço |

**Payload POST /servicos:**
```json
{
  "empresa_id": "uuid",
  "nome": "Corte Feminino",
  "descricao": "Corte com lavagem e finalização",
  "duracao_minutos": 60,
  "preco": "120.00"
}
```

### Agendamentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/agendamentos?empresa_id=` | Listar agendamentos |
| POST | `/agendamentos` | Criar agendamento (+ email/SMS confirmação) |
| GET | `/agendamentos/:id` | Buscar agendamento |
| PUT | `/agendamentos/:id` | Atualizar agendamento (+ email/SMS remarcação) |
| PATCH | `/agendamentos/:id` | Atualizar status |
| DELETE | `/agendamentos/:id` | Cancelar agendamento (+ email/SMS cancelamento) |

**Payload POST /agendamentos:**
```json
{
  "empresa_id": "uuid",
  "cliente_id": "uuid",
  "funcionario_id": "uuid",
  "servico_id": "uuid",
  "data_hora": "2025-12-15T14:00:00Z",
  "observacoes": "Cliente pediu para confirmar no dia"
}
```

**Filtros GET /agendamentos:**
- `empresa_id` (obrigatório)
- `funcionario_id`
- `cliente_id`
- `status` (agendado, confirmado, cancelado)
- `data_inicio` (ISO date)
- `data_fim` (ISO date)

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/login` | Login com email/senha |
| POST | `/auth/register` | Registro de nova conta |
| GET | `/auth/check-email` | Verificar disponibilidade de email |

**Payload POST /auth/login:**
```json
{
  "email": "usuario@email.com",
  "senha": "senha123"
}
```

## Notificações

### Templates de Email

| Template | Trigger | Variáveis |
|----------|---------|-----------|
| Boas-vindas Funcionário | POST /funcionarios | FUNC_NOME, EMPRESA_NOME, LOGIN_URL |
| Confirmação Agendamento | POST /agendamentos | CLIENTE_NOME, SERVICO_NOME, DATA_FORMATADA, etc. |
| Remarcação | PUT /agendamentos (data alterada) | DATA_ANTERIOR, DATA_NOVA, etc. |
| Cancelamento | DELETE /agendamentos | CLIENTE_NOME, SERVICO_NOME, DATA, MOTIVO |

### Templates de SMS

| Template | Trigger | Conteúdo |
|----------|---------|----------|
| Boas-vindas | Novo funcionário | "Olá {nome}! Bem-vindo(a) à equipe {empresa}..." |
| Confirmação | Novo agendamento | "{nome}, seu agendamento está confirmado!..." |
| Remarcação | Data alterada | "{nome}, seu agendamento foi REMARCADO!..." |
| Cancelamento | Agendamento cancelado | "{nome}, seu agendamento foi CANCELADO..." |
| OTP | Verificação de cliente | "Seu código de verificação: {codigo}..." |

## Banco de Dados

### Schema (PostgreSQL)

```sql
-- Empresas (tenants)
empresas (
  id VARCHAR PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT UNIQUE,
  categoria categoria_empresa NOT NULL,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  logo TEXT,
  horario_abertura TEXT DEFAULT '08:00',
  horario_fechamento TEXT DEFAULT '18:00',
  dias_funcionamento TEXT[],
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
)

-- Funcionários
funcionarios (
  id VARCHAR PRIMARY KEY,
  empresa_id VARCHAR REFERENCES empresas(id),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cargo TEXT,
  cor TEXT,
  dias_trabalho TEXT[],
  horario_trabalho_inicio TEXT,
  horario_trabalho_fim TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
)

-- Clientes
clientes (
  id VARCHAR PRIMARY KEY,
  empresa_id VARCHAR REFERENCES empresas(id),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
)

-- Serviços
servicos (
  id VARCHAR PRIMARY KEY,
  empresa_id VARCHAR REFERENCES empresas(id),
  nome TEXT NOT NULL,
  descricao TEXT,
  duracao_minutos INTEGER DEFAULT 30,
  preco DECIMAL(10,2) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
)

-- Agendamentos
agendamentos (
  id VARCHAR PRIMARY KEY,
  empresa_id VARCHAR REFERENCES empresas(id),
  cliente_id VARCHAR REFERENCES clientes(id),
  funcionario_id VARCHAR REFERENCES funcionarios(id),
  servico_id VARCHAR REFERENCES servicos(id),
  data_hora TIMESTAMP NOT NULL,
  data_hora_fim TIMESTAMP NOT NULL,
  status status_agendamento DEFAULT 'agendado',
  observacoes TEXT,
  preco_final DECIMAL(10,2),
  criado_em TIMESTAMP DEFAULT NOW()
)

-- ENUMs
CREATE TYPE categoria_empresa AS ENUM ('salao_beleza', 'barbearia', 'clinica_estetica');
CREATE TYPE status_agendamento AS ENUM ('agendado', 'confirmado', 'cancelado');
```

## Desenvolvimento

### Comandos

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Push schema para banco
npm run db:push
```

### Deploy

O deploy é automático via Cloudflare Pages:

1. Push no branch `master` do GitHub
2. Cloudflare Pages detecta e inicia build
3. Deploy automático para produção

**URLs de produção:**
- App: https://app.livegenda.com
- Landing: https://livegenda.com

## Licença

Proprietário - Livegenda
