"""Extensible, fail-open stages before the existing MP3 upload process."""

from __future__ import annotations

import json
import os
import subprocess
import tempfile
from collections.abc import Callable
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Literal

from processing.detect import IntroMatch, detect_intro
from processing.media import probe_duration, trim_audio


@dataclass(frozen=True)
class ProcessingResult:
    status: Literal["trimmed", "unchanged"]
    source_file: Path
    output_file: Path
    cut_at_seconds: float
    duration_before_seconds: float
    duration_after_seconds: float
    match: IntroMatch | None = None

    def to_dict(self) -> dict[str, object]:
        value = asdict(self)
        value["source_file"] = str(self.source_file)
        value["output_file"] = str(self.output_file)
        return value


@dataclass
class ProcessingContext:
    source: Path
    destination: Path
    reference: Path
    matcher: Path
    original_duration: float
    selected: Path
    cut_seconds: float = 0.0
    selected_duration: float = 0.0
    match: IntroMatch | None = None


def _detect_opening(context: ProcessingContext) -> None:
    context.match = detect_intro(context.source, context.reference, context.matcher)


def _trim_prefix(context: ProcessingContext) -> None:
    if context.match is None:
        return
    # Keep the leading edge of the jingle even with sub-second fingerprint drift.
    seconds = max(0.0, context.match.start_seconds - 0.5)
    if seconds < 0.1 or seconds >= context.original_duration - 1:
        return
    context.selected_duration = trim_audio(context.source, context.destination, seconds)
    context.selected = context.destination
    context.cut_seconds = seconds


def _validate_output(context: ProcessingContext) -> None:
    if context.selected == context.source:
        return
    expected = context.original_duration - context.cut_seconds
    if abs(context.selected_duration - expected) > 1:
        raise ValueError("Trimmed audio duration differs from expected duration")
    actual = probe_duration(context.selected)
    if abs(actual - expected) > 1:
        raise ValueError("Trimmed audio failed duration validation")


_STEPS: tuple[Callable[[ProcessingContext], None], ...] = (
    _detect_opening,
    _trim_prefix,
    _validate_output,
)


def _save_manifest(path: Path, result: ProcessingResult) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", dir=path.parent,
        prefix=f".{path.stem}-", suffix=".json", delete=False,
    ) as pending:
        temporary_path = Path(pending.name)
        json.dump(result.to_dict(), pending, indent=2, ensure_ascii=False)
        pending.write("\n")
    try:
        os.replace(temporary_path, path)
    finally:
        temporary_path.unlink(missing_ok=True)


def process_audio(
    source: Path,
    destination: Path,
    fingerprint: Path,
    audfprint_script: Path,
    manifest: Path,
) -> ProcessingResult:
    """Run all stages, falling back to the validated untouched WAV on error."""
    source = source.resolve()
    destination = destination.resolve()
    manifest = manifest.resolve()
    if source == destination:
        raise ValueError("Processing must never overwrite the source WAV")

    original_duration = probe_duration(source)  # Invalid originals remain blocking.
    context = ProcessingContext(
        source=source,
        destination=destination,
        reference=fingerprint.resolve(),
        matcher=audfprint_script.resolve(),
        original_duration=original_duration,
        selected=source,
        selected_duration=original_duration,
    )
    destination_existed = destination.exists()
    try:
        for step in _STEPS:
            step(context)
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
        print(f"postprocessing bypassed: {type(error).__name__}")
        if not destination_existed:
            destination.unlink(missing_ok=True)
        context.selected = source
        context.selected_duration = original_duration
        context.cut_seconds = 0.0

    result = ProcessingResult(
        status="trimmed" if context.selected == destination else "unchanged",
        source_file=source,
        output_file=context.selected,
        cut_at_seconds=context.cut_seconds,
        duration_before_seconds=original_duration,
        duration_after_seconds=context.selected_duration,
        match=context.match,
    )
    _save_manifest(manifest, result)
    return result
