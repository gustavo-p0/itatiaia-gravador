# Registro de Decisões Técnicas (Architecture Decision Records)

Este documento centraliza as principais decisões de engenharia de software tomadas para garantir a resiliência e a estabilidade do ecossistema do **Itatiaia Gravador**.

## 1. Descoberta Dinâmica de Serviços (Dynamic Stream Discovery)
- **Contexto:** Links de streaming de rádio frequentemente mudam de domínio, IP, ou porta. Fixar (hardcode) a URL do Icecast (`8903.brasilstream.com.br`) resulta em falhas crônicas se a emissora mudar de provedor.
- **Decisão:** Integramos a API pública do **Radio Browser** no workflow.
- **Consequência:** Antes de cada gravação, o robô faz uma consulta à API para buscar a URL ativa (`url_resolved`) filtrando por Belo Horizonte. Caso a emissora mude sua infraestrutura, a comunidade atualiza o Radio Browser e nosso sistema se auto-corrige sem necessidade de alterações no código. As URLs estáticas foram rebaixadas para _fallbacks_.

## 2. Chunking e Bufferização no Web Service (Next.js)
- **Contexto:** A hospedagem gratuita/básica do Player Web (ex: Render) limitava a memória da aplicação (OOM - Out of Memory). Quando o player tentava repassar arquivos de +80MB do Google Drive para o cliente de uma só vez, a memória estourava e o container reiniciava.
- **Decisão:** Reescrever a rota de proxy (`app/api/files/[id]/route.ts`) para honrar os cabeçalhos `Range` do cliente e forçar um limite estrito.
- **Consequência:** A API agora converte requisições do front-end em blocos de no máximo **2MB** (`MAX_CHUNK_SIZE`). O tráfego flui do Google Drive para o usuário em pequenos pedaços, mantendo o consumo de memória do Next.js próximo a zero.

## 3. Compressão MP3 em Passos Separados
- **Contexto:** O objetivo original era fazer `-c copy` (Stream Copy) do AAC original para salvar CPU, mas os arquivos ocupavam muito espaço no Google Drive, e o stream da rádio costuma ter variações bruscas de configuração no meio da madrugada (ex: `Sample Rate: 48000 vs 44100`), quebrando decoders e o próprio FFmpeg.
- **Decisão:** Extrair o áudio para um formato cru e robusto (`pcm_s16le` - WAV), forçar uma normalização de hardware (`-ar 44100 -ac 1`), e então realizar a compressão LAME MP3 em `96k` (qualidade de fala sem cortes audíveis; ~173 MB por 4h).
- **Consequência:** Uso drástico de redução de armazenamento (arquivos muito menores) e imunidade total a mudanças de Sample Rate no meio do stream (Midstream Configuration Change).

## 4. IP Bans e Camuflagem no GitHub Actions
- **Contexto:** Servidores Icecast e WAFs frequentemente dão _shadowban_ (timeout) em blocos de IP da Microsoft Azure (onde rodam os runners do GitHub), especialmente se houverem conexões longas (4h).
- **Decisão:** Disfarçar a origem da conexão injetando um header de navegador comum (`-user_agent "Mozilla/5.0..."`) nativamente no FFmpeg, além de criar uma cascata de tentativas em múltiplas portas.
- **Consequência:** Burlar proteções básicas Anti-Bot e Anti-DDoS dos provedores de rádio. Para bloqueios agressivos definitivos, a documentação aponta o fallback arquitetural para um _Self-Hosted Runner_.

## 5. Idempotência e Tolerância a Partição (Teorema CAP)
- **Contexto:** O pipeline roda na nuvem por horas e falhas de rede entre o GitHub Actions, o Icecast e o Google Drive são estatisticamente garantidas.
- **Decisão:** Tratar a rede como hostil.
- **Consequência:** 
  1. FFmpeg programado para loops agressivos de re-conexão (`-reconnect_delay_max 60`).
  2. Rclone configurado com `--checksum` (Idempotência). Se o workflow cair durante o upload e for reiniciado, ele não fará upload duplo nem sobrescreverá caso o arquivo inteiro já exista.

## 6. Seguro de Corrida (Failover Contínuo e Seamless Stitching)
- **Contexto:** Se uma URL ativa caísse definitivamente no meio da madrugada (ex: na 2ª hora de gravação), o FFmpeg salvava o que conseguiu e abortava. Para ter 4 horas garantidas, seria necessário retomar a gravação na próxima URL de fallback exatamente de onde parou.
- **Decisão:** Criamos um controlador de estado no Bash (`while loop`) associado ao `ffprobe` e ao *Demuxer Concat* do FFmpeg.
- **Consequência:** O script impõe uma meta rigorosa de 14400 segundos. Se o FFmpeg abortar prematuramente, o `ffprobe` afere quantos segundos foram salvos (`itatiaia_part_X.wav`). O controlador subtrai isso da meta total e retoma a gravação imediatamente com o tempo restante na próxima URL de fallback. Ao final da corrida, o *Demuxer Concat* funde todas as partes. Como o áudio bruto (`pcm_s16le`) tem parâmetros rigorosamente fixados (44100Hz, Mono), a fusão dos arquivos ocorre sem cortes ou corrupções audíveis.

## 7. Remoção do Filtro Assíncrono de Resample (Causa Raiz do "Engasgo")
- **Contexto:** A gravação apresentava microcortes periódicos ("áudio engasgando", tipo "bom di rad do brasi") mesmo com o stream direto fluido. O workflow havia ganhado o filtro `-af "aresample=44100:async=1000:first_pts=0"` para sanar erros de troca de sample rate no meio do stream.
- **Evidência:** Na run `35683621444`, **324 avisos `Non-monotonic DTS`** no mesmo segundo (~30s após o início), com o DTS pulando de `1320960` (= 30s × 44100 Hz) para `0`. O `first_pts=0` zerava a timeline e o `async=1000` "corrigia" a discontinuidade esticando, encurtando, inserindo ou removendo amostras — alterações audíveis como engasgo. Testes controlados (mesma base AAC com e sem filtro) mostraram que o filtro era transparente quando o timeline era limpo; o bug só se manifestava nas condições de timestamp do Actions.
- **Decisão:** Remover a linha `-af` inteira, mantendo apenas `-ar 44100 -ac 1 -c:a pcm_s16le`. A normalização de sample rate midstream (`48000 vs 44100`) continua garantida pelas opções `-ar`/`-ac`, que inserem o resampler padrão sem compensação temporal assíncrona. Em separado, o bitrate do MP3 subiu de `48k` para `96k` para recuperar qualidade de fala (dois problemas distintos: fluidez × fidelidade).
- **Consequência:** Saída WAV/MP3 contínua, sem inserções/remoções de amostras por correção de timestamp. Regressão de qualidade observada após o commit `d688257` deve desaparecer; mantém-se imunidade a mudanças de configuração midstream.
