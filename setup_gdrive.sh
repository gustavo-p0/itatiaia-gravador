#!/bin/bash
# =============================================================
# Script para gerar o token do Google Drive (roda no seu Mac)
# Rode isso UMA VEZ para obter os secrets do GitHub
# =============================================================

echo "📦 Instalando rclone..."
brew install rclone

echo ""
echo "🔧 Iniciando configuração do Google Drive..."
echo "   Quando perguntado, escolha:"
echo "   - Storage type: drive (Google Drive)"
echo "   - Use auto config: Yes"
echo "   - Configure as team drive: No"
echo ""

rclone config

echo ""
echo "✅ Pronto! Agora rode o comando abaixo para ver seu token:"
echo ""
echo "   cat ~/.config/rclone/rclone.conf"
echo ""
echo "Você vai ver algo assim:"
echo ""
echo "   [gdrive]"
echo "   type = drive"
echo "   client_id = SEU_CLIENT_ID"
echo "   client_secret = SEU_CLIENT_SECRET"
echo "   token = {\"access_token\":\"...\",\"refresh_token\":\"...\"}"
echo ""
echo "📋 Copie esses 3 valores e adicione como Secrets no GitHub:"
echo "   - GDRIVE_CLIENT_ID"
echo "   - GDRIVE_CLIENT_SECRET"
echo "   - GDRIVE_TOKEN  (o JSON inteiro)"
echo ""
echo "📍 Para adicionar Secrets:"
echo "   GitHub → seu repositório → Settings → Secrets and variables → Actions → New repository secret"