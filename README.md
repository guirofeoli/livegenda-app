# Livegenda

Sistema completo de agendamento para salões de beleza, barbearias e clínicas de estética.

## Visão Geral (Contexto de Negócio)

O Livegenda é uma aplicação web focada em otimizar o fluxo de agendamentos e operação diária de estabelecimentos de beleza e bem‑estar. Ele permite que gestores e profissionais organizem horários, cadastrem serviços e clientes, gerenciem a disponibilidade da equipe, reduzam faltas (no‑show) com lembretes automáticos e acompanhem indicadores básicos do negócio.

Principais objetivos:
- Reduzir conflitos de agenda e sobreposição de horários.
- Melhorar a taxa de comparecimento com lembretes/notificações.
- Facilitar o autoagendamento pelo cliente (opcional) e o agendamento pelo recepcionista.
- Dar visibilidade ao dono/gestor por meio de relatórios simples (produção por profissional, serviços mais vendidos, taxa de ocupação, etc.).

## Estrutura do Projeto

```
/                  → Aplicação React (app.livegenda.com)
/landing           → Landing Page (livegenda.com)
```

Pastas relevantes (nível raiz):
- `/public` → assets estáticos do app
- `/src` → código-fonte do frontend (componentes, páginas, hooks, etc.)
- `/apps` → (quando aplicável) módulos/deploys adicionais

## Arquitetura (Frontend e visão futura de Backend)

Frontend (atual):
- SPA em React + Vite
- UI com TailwindCSS e shadcn/ui
- Roteamento via React Router
- Comunicação com API via React Query (cache, retries, estados de loading)

Padrões recomendados no frontend:
- Páginas em `src/pages`, componentes reutilizáveis em `src/components`, hooks em `src/hooks`, serviços de API em `src/services`.
- Design system leve com shadcn/ui e tokens do Tailwind.

Backend (a ser implementado):
- API REST em `api.livegenda.com` com autenticação (JWT/OAuth) e multitenancy (cada estabelecimento = tenant).
- Recursos principais: autenticação/usuários, agenda, agendamentos, clientes, serviços, profissionais, disponibilidade/expediente, pagamentos (futuro), notificações e relatórios.

Fluxo de dados (alto nível):
Cliente (SPA) ⇄ API REST (auth + recursos) ⇄ Banco de Dados

## Deploy

### Aplicação (App)
- Build: `pnpm run build`
- Output: `dist/`
- URL: https://app.livegenda.com

### Landing Page
- Arquivos estáticos em `/landing`
- URL: https://livegenda.com

## Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Rodar aplicação em desenvolvimento
pnpm run dev

# Build para produção
pnpm run build
```

## Tecnologias

- React + Vite
- TailwindCSS
- Shadcn/ui
- React Router
- React Query

## Telas Principais (Planejadas/Existentes)

- Autenticação: login, recuperação de senha.
- Dashboard: visão rápida de hoje/semana, indicadores de ocupação e próximos horários.
- Agenda/Calendário: visualização por dia/semana, arrastar & soltar (drag‑n‑drop) para remarcação, filtros por profissional, sala/cadeira.
- Clientes: CRUD de clientes, histórico de atendimentos.
- Serviços: CRUD de serviços, duração e preço.
- Profissionais: gerenciamento de equipe, especialidades e comissões (futuro).
- Disponibilidade/Expediente: configuração de horários, feriados, bloqueios.
- Agendamentos: criação/edição/cancelamento, confirmação, lembretes.
- Notificações: e‑mail/SMS/WhatsApp (integrações futuras) para confirmação e lembretes.
- Relatórios: produtividade por profissional, serviços mais vendidos, taxa de no‑show.
- Configurações da Empresa: dados do estabelecimento, meios de pagamento (futuro), integrações.

## API Esperada (esboço de endpoints do backend)

Base: `https://api.livegenda.com`

Autenticação e sessão:
- POST `/auth/login` → autentica e retorna token JWT.
- POST `/auth/refresh` → renova token.
- POST `/auth/logout` → invalida sessão.

Usuários/Contas/Tenant:
- GET `/me` → dados do usuário logado.
- GET `/tenants` | POST `/tenants` → gestão de estabelecimentos.
- GET `/users` | POST `/users` | PATCH `/users/{id}`

Clientes:
- GET `/customers` | POST `/customers`
- GET `/customers/{id}` | PATCH `/customers/{id}` | DELETE `/customers/{id}`

Serviços:
- GET `/services` | POST `/services`
- GET `/services/{id}` | PATCH `/services/{id}` | DELETE `/services/{id}`

Profissionais/Recursos:
- GET `/staff` | POST `/staff` | PATCH `/staff/{id}`
- GET `/resources` (salas/cadeiras) | POST `/resources`

Disponibilidade e expediente:
- GET `/availability` → disponibilidade calculada (por serviço/profissional/data)
- GET `/working-hours` | PATCH `/working-hours` → regras de expediente
- POST `/blocks` | DELETE `/blocks/{id}` → bloqueios de agenda

Agendamentos:
- GET `/appointments` (filtros: data, profissional, status)
- POST `/appointments` → cria horário
- GET `/appointments/{id}` | PATCH `/appointments/{id}` | DELETE `/appointments/{id}`
- POST `/appointments/{id}/confirm` | POST `/appointments/{id}/cancel`

Pagamentos (futuro):
- POST `/payments/intent` | POST `/payments/webhook`

Notificações (futuro):
- POST `/notifications/test` | POST `/notifications/send`

Relatórios/Analytics:
- GET `/analytics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD`
- GET `/analytics/staff-performance`

Configurações:
- GET `/settings` | PATCH `/settings`

Padrões de resposta:
- Paginação: `?page=1&pageSize=20`
- Ordenação: `?sort=createdAt:desc`
- Erros no padrão RFC7807 (problem+json) ou `{ message, code, details }`.

## Modelos de Dados (resumo sugerido)

Exemplos mínimos de payloads (podem evoluir; abaixo em JSON válido, sem comentários):

```json
{
  "id": "cus_123",
  "name": "Maria Silva",
  "phone": "+55 11 99999-0000",
  "email": "maria@exemplo.com",
  "notes": "Prefere sábados"
}
```

```json
{
  "id": "srv_123",
  "name": "Corte Feminino",
  "durationMin": 60,
  "price": 120.0
}
```

```json
{
  "id": "apt_123",
  "customerId": "cus_123",
  "serviceId": "srv_123",
  "staffId": "stf_987",
  "start": "2025-12-01T14:00:00Z",
  "end": "2025-12-01T15:00:00Z",
  "status": "scheduled"
}
```

Status possíveis para `status`: `scheduled`, `confirmed`, `completed`, `canceled`.

## Convenções & Boas Práticas

- i18n pronto para pt‑BR inicialmente; preparar chaves para futura tradução.
- Componentes desacoplados (controlados) e lógica de dados em hooks/serviços.
- React Query para chamadas HTTP com chaves de cache por recurso e parâmetros.
- Tratamento de erros com toasts e mensagens amigáveis.
