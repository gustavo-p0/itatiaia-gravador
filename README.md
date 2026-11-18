# Gravador Automático — Rádio Itatiaia

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

**Importante:** os arquivos de áudio na pasta **Itatiaia** do Google Drive devem estar compartilhados como **"Qualquer pessoa com o link"** (Viewer). Sem isso, o player não conseguirá acessar os arquivos diretamente.

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

Ao concluir a execução, você terá um arquivo `itatiaia_YYYY-MM-DD.mp3` na pasta **Itatiaia** do seu Google Drive, pronto para ouvir. O workflow é acionado manualmente (`workflow_dispatch`) ou por um disparador externo (`repository_dispatch`); não há cron declarado neste repositório.

A gravação é normalizada para **44,1 kHz, mono** e depois comprimida como **MP3 a 96 kbit/s**. Uma gravação de 4 horas ocupa aproximadamente **173 MB**. A normalização também evita erros de reprodução quando a rádio muda o sample rate do stream entre 48 kHz e 44,1 kHz.

O arquivo WAV intermediário existe somente durante o workflow e é removido antes do upload. O upload envia apenas um arquivo por vez e usa buffers pequenos para limitar o uso de memória.

### Pós-processamento da abertura

Após reunir as partes WAV, mas **antes de comprimir para MP3**, um pipeline Python tenta localizar a abertura do *Dona da Noite* usando um fingerprint acústico de aproximadamente 41,66 segundos. O reconhecimento utiliza `audfprint` (MIT) fixado no commit `cb03ba99feafd41b8874307f0f4e808a6ce34362`, percorrendo a gravação em blocos de 15 minutos com 60 segundos de sobreposição. Assim, a busca não precisa manter as quatro horas de áudio em memória.

- Quando o reconhecimento é confiável, o pipeline preserva a vinheta e remove apenas o áudio anterior a ela, com uma margem de segurança de 0,5 segundo.
- Quando a abertura não é encontrada, a correspondência é incerta ou o processamento falha, **o arquivo original, sem cortes, é publicado normalmente**. Não são criados alertas nem notificações de detecção.
- Uma origem ausente ou corrompida continua impedindo a publicação; falhas de codificação MP3/upload também permanecem bloqueantes.
- O WAV consolidado jamais é sobrescrito: a etapa usa arquivo temporário, valida a duração e produz um manifesto JSON que escolhe a entrada para a compressão.
- O repositório contém somente `processing/references/dona_da_noite_intro.pklz`, um fingerprint derivado da abertura, e **não** o áudio da emissora.

O recorte máximo aceito automaticamente é de uma hora. Essa restrição é intencional: correspondências muito tardias poderiam remover grande parte do programa em caso de falso positivo; nesses casos, o original é mantido.

Para validar o pipeline localmente, instale FFmpeg/ffprobe e Python 3.12 e execute `python3 -m unittest discover -s processing/tests -v`. As decisões de arquitetura estão registradas em `docs/DECISOES_TECNICAS.md`. O motor de fingerprint depende das bibliotecas listadas em `processing/requirements.txt` e da revisão do `audfprint` acima.

---

## Observações

- O repositório deve ser **privado** para proteger os seus tokens
- O token do Google Drive tem refresh automático — não precisa renovar
- Se quiser gravar só alguns dias da semana, edite o cron em `gravar.yml`:
  - Seg a Sex: `0 3 * * 1-5`
  - Só fim de semana: `0 3 * * 6,0`

## Resiliência a falhas de rede

O pipeline trata a conexão com a rádio e o Google Drive como sujeita a **partições de rede**. Na prática, seguindo o raciocínio do teorema CAP, ele prioriza disponibilidade durante falhas transitórias e recupera a consistência por convergência:

- **Failover em Movimento (Mid-Race Insurance):** Se um servidor cair definitivamente no meio da madrugada, o script inspeciona os segundos gravados (`ffprobe`), pula dinamicamente para uma URL reserva (Dynamic Discovery), capta o tempo restante e "solda" os áudios de forma imperceptível no final.
- FFmpeg reconecta em EOF, erros TCP/TLS e respostas HTTP `408`, `429` e `5xx`, usando backoff exponencial limitado a 60 segundos.
- Instalação de pacotes e rclone possui tentativas adicionais com espera progressiva.
- O upload usa os retries internos do rclone e até 6 tentativas externas com backoff de 10 a 120 segundos.
- `copyto` grava sempre no mesmo caminho diário e `--checksum` evita duplicação ou reenvio desnecessário após uma resposta perdida. Assim, repetir o job é idempotente quanto ao nome do arquivo no Drive.

Falhas permanentes continuam encerrando o job com erro em vez de produzir ou publicar silenciosamente um arquivo incompleto.

## Fontes & Tecnologias (Sources)

O projeto foi construído e estabilizado graças a várias ferramentas open-source e APIs públicas:

- **[Radio Browser API](https://www.radio-browser.info/):** Utilizado para Descoberta Dinâmica de Serviços (Dynamic Service Discovery). Garante que a URL da rádio seja sempre a mais atual, atuando como o fallback principal caso o link estático caia ou mude de IP.
- **[FFmpeg](https://ffmpeg.org/):** Motor de áudio responsável por conectar no *Icecast*, baixar o stream, re-escanear *sample rates* no meio da transmissão, garantir a normalização do espectro e realizar a compressão pesada para MP3.
- **[Rclone](https://rclone.org/):** Usado para a comunicação resiliente e idempotente de CLI com a API do Google Drive sem a necessidade de SDKs complexos.
- **[audfprint](https://github.com/dpwe/audfprint):** Reconhecimento local da assinatura acústica de abertura, sem API externa de IA nem transcrição de voz.
- **[Next.js API Routes](https://nextjs.org/):** O backend de roteamento e *proxy* do player lida com as requisições de áudio por *Range Headers*, garantindo a segmentação do buffer para evitar os limites de RAM da plataforma de hospedagem.

## Arquitetura (C4 — Nível 2: Containers)

Diagrama de containers: expõe as unidades internas do sistema (orquestrador, pipeline de mídia, upload e player) e suas interações com sistemas externos. A ordem de declaração dos nós foi otimizada por enumeração exhaustiva de permutações (Sugiyama) para eliminar cruzamentos entre arestas.

```mermaid
%%{init: {'theme': 'default', 'themeVariables': {'darkMode': false, 'fontFamily': 'Helvetica'}}}%%
C4Container
title C4 Nível 2 (Container) — Ecossistema Itatiaia Gravador

Person_Ext(user, "Ouvinte", "Escuta as gravações")
System_Ext(gdrive, "Google Drive", "Armazenamento MP3")
System_Ext(radio_api, "Radio Browser API", "Descoberta dinâmica")
System_Ext(icecast, "Icecast / BrasilStream", "Stream ao vivo")

System_Boundary(itatiaia, "Sistema Itatiaia Gravador") {
    Container(webapp, "Player Web", "Next.js", "UI + proxy de áudio")
    Container(rc, "Uploader", "rclone", "Upload idempotente")
    Container(orch, "Orquestrador", "Bash", "Fallback e retries")
    Container(ffm, "Pipeline FFmpeg", "ffmpeg", "Captura e encode")
    Container(postproc, "Pós-processador", "Python + audfprint", "Detecta abertura e corta prefixo com fail-open")
}

Rel_D(user, webapp, "Ouve", "HTTPS")
Rel_U(webapp, gdrive, "Lê 2 MB", "Drive API")
Rel_U(rc, gdrive, "Envia MP3", "HTTPS")
Rel_U(orch, radio_api, "Descobre URL", "HTTPS")
Rel_U(ffm, icecast, "Captura", "TCP")
Rel_L(orch, rc, "Upload")
Rel_R(orch, ffm, "Executa")
Rel_D(orch, postproc, "Processa WAV")
Rel_R(postproc, ffm, "Usa FFmpeg")

UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

## Decisões de Engenharia

Para entender os desafios enfrentados (Limites de Memória no Render, Bloqueios de IP, Mudanças de Sample Rate, Espaço em Disco) e como os resolvemos com padrões de software, leia a página dedicada:

👉 **[Registro de Decisões Técnicas (ADR)](docs/DECISOES_TECNICAS.md)**
