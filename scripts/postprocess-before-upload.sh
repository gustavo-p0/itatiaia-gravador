#!/usr/bin/env bash
set -euo pipefail

raw_file="${1:?source WAV required}"
processed_file="${2:?processed WAV destination required}"
manifest_file="${3:?postprocessing manifest required}"
python_bin="${POSTPROCESS_PYTHON:-python3}"
matcher="${AUDPRINT_SCRIPT:-}"
fingerprint="processing/references/dona_da_noite_intro.pklz"
: "${GITHUB_ENV:?GITHUB_ENV must be set by GitHub Actions}"

# An invalid source is NOT a recoverable detection failure.
source_path="$("$python_bin" - "$raw_file" <<'PY'
import sys
from pathlib import Path
from processing.media import probe_duration

source = Path(sys.argv[1]).resolve()
probe_duration(source)
print(source)
PY
)"
selected_source="$source_path"

if [[ -n "$matcher" && -f "$matcher" && -f "$fingerprint" ]]; then
  if "$python_bin" -m processing \
      --input "$source_path" \
      --processed-output "$processed_file" \
      --fingerprint "$fingerprint" \
      --audfprint-script "$matcher" \
      --manifest "$manifest_file"; then
    if candidate="$("$python_bin" - "$manifest_file" <<'PY'
import json
import sys
from pathlib import Path

with Path(sys.argv[1]).open(encoding="utf-8") as stream:
    print(json.load(stream)["output_file"])
PY
)"; then
      if [[ -n "$candidate" && "$candidate" != *$'\n'* ]] && \
          "$python_bin" - "$candidate" <<'PY'
import sys
from pathlib import Path
from processing.media import probe_duration

probe_duration(Path(sys.argv[1]))
PY
      then
        selected_source="$candidate"
      fi
    fi
  fi
else
  echo "postprocessing bypassed: matching dependency unavailable"
fi

printf 'AUDIO_SOURCE=%s\n' "$selected_source" >> "$GITHUB_ENV"
echo "Audio selected for MP3: $selected_source"
