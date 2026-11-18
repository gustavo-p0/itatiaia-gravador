import hashlib
import json
import shutil
import subprocess
import tempfile
import unittest
import wave
from pathlib import Path
from unittest.mock import patch

from processing.detect import IntroMatch
from processing.pipeline import process_audio


@unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "FFmpeg tools required")
class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="itatiaia-test-")
        self.addCleanup(self.directory.cleanup)
        folder = Path(self.directory.name)
        self.source = folder / "raw.wav"
        self.processed = folder / "processed.wav"
        self.manifest = folder / "result.json"
        subprocess.run(
            [
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-f", "lavfi", "-i", "anoisesrc=d=20:r=44100:seed=7",
                "-ac", "1", "-c:a", "pcm_s16le", str(self.source),
            ],
            check=True,
        )

    def _run(self):
        return process_audio(
            self.source,
            self.processed,
            Path("unneeded-reference.pklz"),
            Path("unneeded-matcher.py"),
            self.manifest,
        )

    def test_confirmed_match_trims_prefix_and_preserves_original(self):
        original_digest = hashlib.sha256(self.source.read_bytes()).hexdigest()
        confident = IntroMatch(5.0, 300, 350, 20.0)

        with patch("processing.pipeline.detect_intro", return_value=confident):
            result = self._run()

        self.assertEqual(result.status, "trimmed")
        self.assertEqual(result.output_file, self.processed.resolve())
        self.assertAlmostEqual(result.cut_at_seconds, 4.5)
        self.assertAlmostEqual(result.duration_after_seconds, 15.5, delta=0.1)
        self.assertEqual(hashlib.sha256(self.source.read_bytes()).hexdigest(), original_digest)
        self.assertEqual(json.loads(self.manifest.read_text())["output_file"], str(self.processed.resolve()))
        with wave.open(str(self.source)) as raw, wave.open(str(self.processed)) as trimmed:
            raw.setpos(int(4.5 * 44100))
            self.assertEqual(trimmed.readframes(2048), raw.readframes(2048))

    def test_no_match_publishes_original_without_creating_processed_file(self):
        with patch("processing.pipeline.detect_intro", return_value=None):
            result = self._run()

        self.assertEqual(result.status, "unchanged")
        self.assertEqual(result.output_file, self.source.resolve())
        self.assertFalse(self.processed.exists())
        self.assertAlmostEqual(result.duration_after_seconds, 20.0, delta=0.1)
        self.assertEqual(json.loads(self.manifest.read_text())["status"], "unchanged")

    def test_detector_failure_falls_back_to_original(self):
        with patch("processing.pipeline.detect_intro", side_effect=RuntimeError("audfprint unavailable")):
            result = self._run()

        self.assertEqual(result.status, "unchanged")
        self.assertEqual(result.output_file, self.source.resolve())

    def test_trim_failure_removes_partial_output_and_falls_back(self):
        confident = IntroMatch(5.0, 300, 350, 20.0)
        with (
            patch("processing.pipeline.detect_intro", return_value=confident),
            patch("processing.pipeline.trim_audio", side_effect=RuntimeError("ffmpeg failed")),
        ):
            result = self._run()

        self.assertEqual(result.status, "unchanged")
        self.assertFalse(self.processed.exists())
        self.assertEqual(result.output_file, self.source.resolve())

    def test_invalid_original_blocks_publication_and_manifest(self):
        self.source.write_bytes(b"")
        with self.assertRaises((ValueError, RuntimeError)):
            self._run()

        self.assertFalse(self.manifest.exists())


if __name__ == "__main__":
    unittest.main()
