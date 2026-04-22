
Copiar

#!/bin/bash
# =============================================================
# Script para reverter tudo da configuração do gravador Itatiaia
# =============================================================
 
echo "🧹 Iniciando limpeza..."
 
# Remove configuração do rclone
if [ -f ~/.config/rclone/rclone.conf ]; then
  rm ~/.config/rclone/rclone.conf
  echo "✅ Configuração do rclone removida"
else
  echo "⏭️  Nenhuma configuração do rclone encontrada"
fi
 
# Remove rclone instalado via brew
if brew list rclone &>/dev/null; then
  brew uninstall rclone
  echo "✅ rclone desinstalado"
else
  echo "⏭️  rclone não estava instalado via brew"
fi
 
echo ""
echo "🔑 Não esqueça de fazer isso manualmente:"
echo ""
echo "   1. Revogar acesso do rclone à sua conta Google:"
echo "      https://myaccount.google.com/permissions"
echo "      → encontre 'rclone' e clique em Remover acesso"
echo ""
echo "   2. Deletar os Secrets no GitHub:"
echo "      GitHub → seu repositório → Settings → Secrets and variables → Actions"
echo "      → apague GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET e GDRIVE_TOKEN"
echo ""
echo "   3. Deletar o repositório no GitHub (se quiser):"
echo "      GitHub → seu repositório → Settings → (lá embaixo) → Delete this repository"
echo ""
echo "✅ Limpeza local concluída!"
 