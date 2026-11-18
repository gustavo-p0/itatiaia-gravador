# Audio Intro Postprocessing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cortar com segurança o conteúdo anterior à abertura do Dona da Noite, publicando o WAV integral quando a detecção for incerta.

**Architecture:** Um CLI Python executa etapas independentes após a consolidação do WAV e antes da compressão MP3. O fingerprint (sem o áudio original) fica no repositório, o motor audfprint é fixado em revisão conhecida e o workflow consome um manifesto para escolher a fonte da compressão.

**Tech Stack:** Python 3.12, biblioteca padrão, FFmpeg/ffprobe, audfprint (MIT), numpy/scipy/docopt/joblib/psutil, GitHub Actions, Rclone.

**Spec:** `docs/superpowers/specs/2026-11-18-audio-intro-postprocessing-design.md`

## Global Constraints

- Não alterar o WAV de origem nem criar alertas/notificações.
- Fail-open apenas para detecção/processamento; WAV original inválido, codificação e upload continuam bloqueantes.
- Processar em blocos com sobreposição ≥ duração da referência; buscar pela gravação completa.
- Não versionar o áudio protegido; versionar somente fingerprint derivado.
- Não alterar frontend, API, formato de nome diário ou credenciais.
- Sem dependência de retrocompatibilidade com arquivos antigos.

## Review Focus

- Match bem no limite do bloco: deve preservar toda a abertura; cobrir com teste de janela sobreposta no Task 1.
- Correspondência fraca ou segunda correspondência quase equivalente: deve deixar original; cobrir no Task 1.
- Comando audfprint ausente ou falho: deve publicar original; cobrir no Task 2.
- Falha de corte ou saída incoerente: deve publicar original sem deixar saída parcial; cobrir no Task 2.
- Workflow sem dependências de áudio instaladas: deve comprimir WAV original; cobrir execução simulada do shell no Task 3.

---

### Task 1: Detector de abertura por fingerprint

**Files:**
- Create: `processing/detect.py`, `processing/tests/test_detect.py`
- Add binary: `processing/references/dona_da_noite_intro.pklz` (fingerprint já gerado e verificado na prova de conceito)

**Interfaces:**
- Produces: `IntroMatch(start_seconds: float, aligned_hashes: int, common_hashes: int, matched_seconds: float)` e `detect_intro(input_path: Path, reference_path: Path, audfprint_script: Path, *, chunk_seconds: int = 900, overlap_seconds: int = 60, max_cut_seconds: float = 3600) -> IntroMatch | None`.

- [ ] **Step 1: Escrever testes RED** para interpretar o formato real do `audfprint`, recuperar o início (`query_start - reference_start`), rejeitar confiança insuficiente/alternativa ambígua e calcular corretamente o deslocamento entre janelas.
- [ ] **Step 2: Executar** `python3 -m unittest processing.tests.test_detect -v` — Expected: FAIL por módulos/funções ausentes.
- [ ] **Step 3: Implementar** `processing/detect.py` com análise limitada a blocos, limites conservadores e parsing de correspondências.
- [ ] **Step 4: Executar** o teste — Expected: PASS e nenhum erro.
- [ ] **Step 5: Commit** `feat: detect program intro with bounded fingerprint search`.

### Task 2: Pipeline, corte seguro e manifesto

**Files:**
- Create: `processing/__init__.py`, `processing/__main__.py`, `processing/pipeline.py`, `processing/media.py`, `processing/tests/test_pipeline.py`

**Interfaces:**
- Consumes: `detect_intro(...) -> IntroMatch | None` do Task 1.
- Produces: `process_audio(source: Path, destination: Path, fingerprint: Path, audfprint_script: Path, manifest: Path) -> ProcessingResult` e CLI `python3 -m processing --input ... --processed-output ... --fingerprint ... --audfprint-script ... --manifest ...`.

- [ ] **Step 1: Escrever testes RED** com WAV sintético, `ffprobe` e erro de detector: match confirmado corta no instante correto, sem match usa fonte original, falha de subprocesso preserva disponibilidade, origem inválida bloqueia e erro de corte remove `.part`.
- [ ] **Step 2: Executar** `python3 -m unittest processing.tests.test_pipeline -v` — Expected: FAIL pelo pipeline ausente.
- [ ] **Step 3: Implementar** camadas de aplicação/infra: `FFmpeg` com trim e timestamps reiniciados, comparação de durações, manifestos atômicos, política fail-open; CLI sem dependências de aplicação web.
- [ ] **Step 4: Executar** a suíte `python3 -m unittest discover -s processing/tests -v` — Expected: PASS.
- [ ] **Step 5: Commit** `feat: introduce fail-open postprocessing pipeline`.

### Task 3: Integrar ao workflow e documentar

**Files:**
- Modify: `.github/workflows/gravar.yml`, `README.md`, `docs/DECISOES_TECNICAS.md`
- Create: `processing/requirements.txt`, `processing/tests/test_workflow.py`

**Interfaces:**
- Consumes: manifesto JSON do Task 2 (campo `output_file`).
- Produces: `AUDIO_SOURCE` no ambiente do workflow, usado como entrada do encoder.

- [ ] **Step 1: Escrever teste RED** que executa um pequeno harness do caminho de seleção de fonte e simula a falha do pós-processamento, garantindo seleção do WAV original e publicação preservada sem alerta.
- [ ] **Step 2: Executar** `python3 -m unittest processing.tests.test_workflow -v` — Expected: FAIL pela integração ainda ausente.
- [ ] **Step 3: Alterar** workflow: instalar motor audfprint fixado em commit e dependências Python, executar o pipeline de forma opcional, ler manifesto quando disponível, comprimir `AUDIO_SOURCE` e limpar intermediários sem remover WAV original prematuramente.
- [ ] **Step 4: Documentar** nova etapa, decisões e variáveis; executar `python3 -m unittest discover -s processing/tests -v` e `npm run build` — Expected: todos verdes.
- [ ] **Step 5: Commit** `feat: wire intro postprocessing before storage upload`.
