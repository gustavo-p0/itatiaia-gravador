# Pós-processamento da abertura — HLD aprovado

## Intenção

Remover o áudio que precede a abertura do programa *Dona da Noite* antes de enviar a gravação ao Google Drive. A abertura em si precisa permanecer intacta. O processamento deve admitir novas etapas futuras, sem envolver o frontend ou a API Next.js.

## Estado atual e integração

O workflow `.github/workflows/gravar.yml` captura o stream, consolida partes em WAV PCM mono/44,1 kHz, comprime em MP3 96 kbit/s e envia pelo Rclone. O novo pipeline entra **após a consolidação WAV e antes da compressão MP3**. O arquivo WAV de origem é sempre imutável.

## Contratos e etapas

1. **Detectar abertura:** gerar blocos temporários de áudio reamostrado e compará-los com um fingerprint da vinheta usando a ferramenta `audfprint` (MIT), fixada em uma revisão. Cada bloco tem sobreposição suficiente para capturar a referência completa quando ela cruza a fronteira entre dois blocos. Retornar a posição absoluta do início da referência e os indicadores de qualidade. O fingerprint deriva do trecho exato de 41,66 s disponibilizado em 18/11/2026; o áudio bruto da emissora não será versionado neste repositório público.
2. **Cortar prefixo:** somente para correspondência confiável, copiar o trecho a partir da abertura para um WAV temporário, reiniciar timestamps e concluir a escrita de forma atômica. Preservar o início da abertura, sem efeitos ou normalização adicionais.
3. **Validar resultado:** comparar o áudio original e o produzido por `ffprobe`, conferindo durações e limites de corte antes de autorizar a compressão.

O pipeline fornece um manifesto JSON com `status` (`trimmed` ou `unchanged`), `source_file`, `output_file`, `cut_at_seconds`, `duration_before_seconds`, `duration_after_seconds` e `match` (quando aplicável). A compressão lê exclusivamente `output_file`.

## Política de falhas

- **Fail-open:** sem correspondência, correspondência insuficiente/ambígua, dependência indisponível ou erro no pós-processamento → usar o WAV original integral. **Não emitir alertas nem notificações.** Logs habituais de execução podem registrar o resultado.
- Arquivo de origem ausente, inválido ou vazio → não publicar.
- Falhas de compressão ou upload permanecem falhas do workflow, não são mascaradas pela política de detecção.
- Evitar falso positivo por limites mínimos de duração e hashes alinhados, margem sobre alternativas e limite configurável de corte máximo. Se houver dúvida, preservar o original.
- A reexecução usa sempre a mesma origem e mesma referência. O arquivo publicado mantém o nome diário anterior, sem duplicatas por mudança de etapa.

## Recorte vertical

| Camada | Responsabilidade |
| --- | --- |
| Orquestração | Workflow GitHub Actions e entrada CLI do pipeline |
| Aplicação | Encadeamento das etapas e política de fallback |
| Domínio | Correspondência, decisão de corte e invariantes de validação |
| Infraestrutura | audfprint, FFmpeg, ffprobe, arquivos locais |
| Integração | MP3 e Rclone para Google Drive |
| Observabilidade | Manifesto JSON e logs normais (sem alertas) |

## Fora do escopo

Não adicionar WebSocket, banco de dados, notificações, reconhecimento de fala, interfaces de revisão manual ou mudança no player. Não tentar extrair dinamicamente a vinheta de arquivos da própria plataforma.

## Critérios de aceite

1. Reconhecer a abertura em posições variáveis e cortar somente seu prefixo.
2. Preservar o início da vinheta, inclusive quando um bloco de análise cruza sua posição.
3. Sem match seguro, publicar a origem integral e sem alertas.
4. Não deixar arquivo parcial com aparência de saída válida após falha.
5. Reprocessar o mesmo WAV e fingerprint com resultado estável.
6. Integrar ao workflow existente antes de MP3/upload sem alterar arquivos do frontend.

## Evidência e limites

No material enviado, a referência definitiva (41,66 s) corresponde ao áudio do primeiro vídeo com deslocamento de ~8,315 s, com correlação temporal de ~0,998. Uma prova de conceito com `audfprint` encontrou 841 hashes temporalmente alinhados e recuperou o deslocamento de 8,3 s. Gravações históricas independentes ainda serão necessárias para avaliar a sensibilidade quando a vinheta mudar de edição ou houver locução sobreposta.
