# 🚀 Livegenda - Guia de Deploy

## Arquitetura Atual (Custo $0)

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE                                 │
│         CDN + SSL + DDoS + Pages + Workers                      │
│                     💰 GRATUITO                                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEON PostgreSQL                              │
│                     💰 GRATUITO                                 │
│                   (0.5GB storage)                               │
└─────────────────────────────────────────────────────────────────┘
```

## Pré-requisitos

1. **Conta Cloudflare** (gratuita) - https://dash.cloudflare.com
2. **Conta GitHub** - https://github.com
3. **Banco Neon** - Já configurado via Replit

## Configuração Inicial

### 1. Cloudflare Pages (Frontend)

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá em **Pages** → **Create a project**
3. Conecte seu repositório GitHub: `guirofeoli/livegenda-app`
4. Configure o build:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist/public`
   - **Root directory:** `/`

5. Variáveis de ambiente:
   ```
   VITE_API_URL=https://api.livegenda.com  (produção)
   VITE_API_URL=https://api-preview.livegenda.com  (preview)
   ```

### 2. Cloudflare Workers (API)

A API usa **Pages Functions** (pasta `functions/`), que é deployada automaticamente com o Pages.

Para configurar secrets:
```bash
# Instalar Wrangler CLI
npm install -g wrangler

# Login no Cloudflare
wrangler login

# Configurar secrets
wrangler secret put DATABASE_URL --env production
wrangler secret put JWT_SECRET --env production
```

### 3. Domínios Personalizados

No Cloudflare Pages:
1. **Custom domains** → Add domain
2. Configure:
   - `livegenda.com` → Landing page
   - `app.livegenda.com` → Aplicação

Para a API (Workers):
1. **Workers & Pages** → Seu worker → **Triggers**
2. Add custom domain: `api.livegenda.com`

### 4. GitHub Actions (CI/CD)

O arquivo `.github/workflows/deploy.yml` já está configurado.

Secrets necessários no GitHub:
```
CLOUDFLARE_API_TOKEN     → Token com permissão de Pages e Workers
CLOUDFLARE_ACCOUNT_ID    → ID da sua conta Cloudflare
DATABASE_URL             → Connection string do Neon
DATABASE_URL_PREVIEW     → Connection string do Neon (dev)
```

## Fluxo de Deploy

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   git push      │────▶│  GitHub Actions │────▶│   Cloudflare    │
│   develop       │     │  (build + test) │     │   (preview)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   merge to      │────▶│  GitHub Actions │────▶│   Cloudflare    │
│   main          │     │  (build + test) │     │   (produção)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Estrutura de Ambientes

| Branch | Ambiente | URL |
|--------|----------|-----|
| `main` | Produção | app.livegenda.com |
| `develop` | Preview | preview.livegenda.pages.dev |
| PR | Preview | pr-123.livegenda.pages.dev |

## Comandos Úteis

```bash
# Desenvolvimento local
npm run dev

# Build para produção
npm run build

# Type check
npm run check

# Deploy manual (se necessário)
wrangler pages deploy dist/public --project-name livegenda
```

## Limites do Free Tier

| Recurso | Limite Gratuito |
|---------|-----------------|
| Cloudflare Pages | Ilimitado |
| Cloudflare Workers | 100,000 req/dia |
| Neon Storage | 0.5 GB |
| Neon Compute | 191h/mês |
| GitHub Actions | 2,000 min/mês |

## Migração para GCP (Futuro)

Consulte `gcp-config.json` para a configuração planejada.

**Quando migrar:**
- [ ] Mais de 50 empresas ativas
- [ ] Mais de 0.5GB de dados
- [ ] Necessidade de WebSockets persistentes
- [ ] Latência < 10ms requerida

## Troubleshooting

### Erro de CORS
Verifique `functions/api/_middleware.ts` - a origem deve estar configurada.

### Erro de Conexão com Banco
1. Verifique se `DATABASE_URL` está configurado como secret
2. Verifique se o IP do Cloudflare está permitido no Neon

### Deploy não atualiza
1. Verifique os logs no GitHub Actions
2. Verifique os logs no Cloudflare Dashboard

## Suporte

- **Cloudflare Docs:** https://developers.cloudflare.com
- **Neon Docs:** https://neon.tech/docs
- **Wrangler CLI:** https://developers.cloudflare.com/workers/wrangler
