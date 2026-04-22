# 📻 Gravador Automático — Rádio Itatiaia

Grava automaticamente 4 horas da Rádio Itatiaia (00h–04h BRT) todo dia e salva no Google Drive.

---

## Como configurar (passo a passo)

### 1. Criar o repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Crie um repositório **privado** com o nome `itatiaia-gravador`
3. Clone no seu Mac:
   ```bash
   git clone https://github.com/SEU_USUARIO/itatiaia-gravador
   cd itatiaia-gravador
   ```

### 2. Copiar os arquivos

Copie o arquivo `.github/workflows/gravar.yml` para dentro do repositório clonado, mantendo a estrutura de pastas.

### 3. Configurar o Google Drive (uma única vez)

No Terminal do seu Mac:

```bash
chmod +x setup_gdrive.sh
./setup_gdrive.sh
```

Isso vai abrir o navegador para você autorizar o acesso ao Google Drive. Depois, rode:

```bash
cat ~/.config/rclone/rclone.conf
```

Você vai ver algo assim:
```
[gdrive]
type = drive
client_id = 123456.apps.googleusercontent.com
client_secret = GOCSPX-xxxxx
token = {"access_token":"...","refresh_token":"...","expiry":"..."}
```

### 4. Adicionar os Secrets no GitHub

Vá em: **GitHub → seu repositório → Settings → Secrets and variables → Actions**

Adicione 3 secrets:

| Nome | Valor |
|------|-------|
| `GDRIVE_CLIENT_ID` | o valor de `client_id` |
| `GDRIVE_CLIENT_SECRET` | o valor de `client_secret` |
| `GDRIVE_TOKEN` | o JSON inteiro do `token` (com as chaves `{}`) |

### 5. Fazer o push

```bash
git add .
git commit -m "setup gravador itatiaia"
git push
```

### 6. Testar manualmente

No GitHub, vá em **Actions → Gravar Rádio Itatiaia → Run workflow**.

Isso vai disparar uma gravação imediata (mas vai gravar 4h, então aguarde ou cancele depois de alguns minutos só para testar o upload).

---

## Resultado

Todo dia, ao acordar, você terá um arquivo `itatiaia_YYYY-MM-DD.mp3` na pasta **Itatiaia** do seu Google Drive, pronto para ouvir.

---

## Observações

- O repositório deve ser **privado** para proteger os seus tokens
- O token do Google Drive tem refresh automático — não precisa renovar
- Se quiser gravar só alguns dias da semana, edite o cron em `gravar.yml`:
  - Seg a Sex: `0 3 * * 1-5`
  - Só fim de semana: `0 3 * * 6,0`
