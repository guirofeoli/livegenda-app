#!/bin/bash

# Script de deploy para Cloudflare Pages
# Execute este script para fazer deploy da aplicação e landing page

echo "🚀 Livegenda - Deploy para Cloudflare Pages"
echo ""

# Verificar se wrangler está instalado
if ! command -v wrangler &> /dev/null; then
    echo "⚠️  Wrangler não encontrado. Instalando..."
    npm install -g wrangler@latest
fi

# Fazer login no Cloudflare (se necessário)
echo "🔐 Verificando autenticação..."
wrangler whoami || wrangler login

# Deploy da aplicação (app)
echo ""
echo "📦 Fazendo deploy da aplicação..."
cd "$(dirname "$0")"
pnpm run build
wrangler pages deploy dist --project-name=livegenda-app

# Deploy da landing page
echo ""
echo "📦 Fazendo deploy da landing page..."
wrangler pages deploy landing --project-name=livegenda

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "URLs:"
echo "  - App: https://livegenda-app.pages.dev"
echo "  - Landing: https://livegenda.com"
