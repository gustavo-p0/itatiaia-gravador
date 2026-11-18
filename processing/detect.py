"""Locate a known program opening without reading the whole recording into RAM."""

from __future__ import annotations

import re
import subprocess
import sys
import tempfile
from collections.abc import Iterator
from dataclasses import dataclass, replace
from pathlib import Path


@dataclass(frozen=True)
class IntroMatch:
    start_seconds: float
    aligned_hashes: int
    common_hashes: int
    matched_seconds: float


_MATCH_LINE = re.compile(
    r"Matched\s+(?P<duration>\d+(?:\.\d+)?)\s+s\s+"
    r"starting at\s+(?P<query>\d+(?:\.\d+)?)\s+s in .+? "
    r"to time\s+(?P<reference>\d+(?:\.\d+)?)\s+s in .+? "
    r"with\s+(?P<aligned>\d+)\s+of\s+(?P<common>\d+) common hashes"
)

# The checked-in opening fingerprint covers 41.66 s. Leave a margin for
# its full occurrence to fit in at least one overlapping analysis window.
MIN_OVERLAP_SECONDS = 45


def parse_matches(output: str) -> list[IntroMatch]:
    """Read audfprint's time-aligned matches, not its approximate rank alone."""
    matches = []
    for line in output.splitlines():
        found = _MATCH_LINE.search(line)
        if found is None:
            continue
        matches.append(
            IntroMatch(
                start_seconds=float(found["query"]) - float(found["reference"]),
                aligned_hashes=int(found["aligned"]),
                common_hashes=int(found["common"]),
                matched_seconds=float(found["duration"]),
            )
        )
    return matches


def choose_match(
    matches: list[IntroMatch],
    *,
    chunk_offset: float,
    max_cut_seconds: float = 3600,
) -> IntroMatch | None:
    """Discard weak and ambiguous matches; return a recording-relative offset."""
    candidates = [
        match
        for match in matches
        if match.aligned_hashes >= 30
        and match.matched_seconds >= 15
        and match.common_hashes > 0
        and match.aligned_hashes / match.common_hashes >= 0.25
        and 0 <= chunk_offset + match.start_seconds <= max_cut_seconds
    ]
    if not candidates:
        return None

    candidates.sort(key=lambda match: match.aligned_hashes, reverse=True)
    best = candidates[0]
    if any(
        other.aligned_hashes >= best.aligned_hashes * 0.75
        and abs(other.start_seconds - best.start_seconds) > 2
        for other in candidates[1:]
    ):
        return None
    return replace(best, start_seconds=chunk_offset + best.start_seconds)


def chunk_offsets(duration: float, chunk_seconds: int, overlap_seconds: int) -> Iterator[int]:
    if chunk_seconds <= 0 or not 0 <= overlap_seconds < chunk_seconds:
        raise ValueError("Invalid analysis chunk size or overlap")
    offset = 0
    while offset < duration:
        yield offset
        if offset + chunk_seconds >= duration:
            break
        offset += chunk_seconds - overlap_seconds


def _probe_duration(input_path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nokey=1:noprint_wrappers=1", str(input_path)],
        capture_output=True,
        text=True,
        check=True,
        timeout=30,
    )
    duration = float(result.stdout.strip())
    if not 0 < duration < float("inf"):
        raise ValueError("Invalid input audio duration")
    return duration


def detect_intro(
    input_path: Path,
    reference_path: Path,
    audfprint_script: Path,
    *,
    chunk_seconds: int = 900,
    overlap_seconds: int = 60,
    max_cut_seconds: float = 3600,
) -> IntroMatch | None:
    """Scan the full input in bounded, overlapping windows until a safe match."""
    if overlap_seconds < MIN_OVERLAP_SECONDS:
        raise ValueError("Analysis overlap is shorter than the opening reference")
    if chunk_seconds <= overlap_seconds:
        raise ValueError("Analysis chunk must exceed the overlap")
    if not reference_path.is_file() or not audfprint_script.is_file():
        raise FileNotFoundError("Fingerprint reference or matcher unavailable")

    duration = _probe_duration(input_path)
    with tempfile.TemporaryDirectory(prefix="itatiaia-intro-") as folder:
        chunk = Path(folder) / "analysis.wav"
        for offset in chunk_offsets(duration, chunk_seconds, overlap_seconds):
            subprocess.run(
                [
                    "ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
                    "-ss", str(offset), "-i", str(input_path), "-t", str(chunk_seconds),
                    "-map", "0:a:0", "-vn", "-ar", "11025", "-ac", "1",
                    "-c:a", "pcm_s16le", str(chunk),
                ],
                check=True,
                capture_output=True,
                timeout=180,
            )
            result = subprocess.run(
                [
                    sys.executable, str(audfprint_script), "match",
                    "--dbase", str(reference_path), "--find-time-range",
                    "--max-matches", "3", str(chunk),
                ],
                capture_output=True,
                text=True,
                check=True,
                timeout=300,
            )
            matched = choose_match(
                parse_matches(result.stdout),
                chunk_offset=offset,
                max_cut_seconds=max_cut_seconds,
            )
            if matched:
                return matched
    return None
