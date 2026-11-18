"""FFmpeg-backed audio IO with validation before atomic publication."""

from __future__ import annotations

import json
import math
import os
import subprocess
import tempfile
from pathlib import Path


def probe_duration(path: Path) -> float:
    if not path.is_file() or path.stat().st_size == 0:
        raise ValueError(f"Audio source missing or empty: {path}")
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error", "-show_entries",
                "format=duration:stream=codec_type", "-of", "json", str(path),
            ],
            capture_output=True,
            text=True,
            check=True,
            timeout=60,
        )
        metadata = json.loads(result.stdout)
        if not any(s.get("codec_type") == "audio" for s in metadata.get("streams", [])):
            raise ValueError("No audio stream found")
        duration = float(metadata["format"]["duration"])
        if not math.isfinite(duration) or duration <= 0:
            raise ValueError("Invalid duration")
        return duration
    except (KeyError, TypeError, subprocess.CalledProcessError, json.JSONDecodeError) as exc:
        raise ValueError(f"Invalid audio source: {path}") from exc


def trim_audio(source: Path, destination: Path, start_seconds: float) -> float:
    """Produce a validated trimmed WAV, atomically replacing only its output."""
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        dir=destination.parent, prefix=f".{destination.stem}-", suffix=".wav", delete=False
    ) as intermediate:
        temporary_path = Path(intermediate.name)
    try:
        subprocess.run(
            [
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
                "-i", str(source), "-map", "0:a:0", "-vn", "-sn", "-dn",
                "-af", f"atrim=start={start_seconds:.6f},asetpts=PTS-STARTPTS",
                "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le",
                str(temporary_path),
            ],
            capture_output=True,
            check=True,
            timeout=900,
        )
        output_duration = probe_duration(temporary_path)
        os.replace(temporary_path, destination)
        return output_duration
    finally:
        temporary_path.unlink(missing_ok=True)
