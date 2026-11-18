"""CLI entry point for the nightly recording workflow."""

import argparse
import sys
from pathlib import Path

from processing.pipeline import process_audio


def main() -> int:
    parser = argparse.ArgumentParser(description="Post-process Itatiaia recording before upload")
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--processed-output", required=True, type=Path)
    parser.add_argument("--fingerprint", required=True, type=Path)
    parser.add_argument("--audfprint-script", required=True, type=Path)
    parser.add_argument("--manifest", required=True, type=Path)
    args = parser.parse_args()
    try:
        result = process_audio(
            args.input,
            args.processed_output,
            args.fingerprint,
            args.audfprint_script,
            args.manifest,
        )
    except (OSError, ValueError) as exc:
        print(f"Invalid source recording: {exc}", file=sys.stderr)
        return 1
    print(f"postprocessing status={result.status} source={result.output_file}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
