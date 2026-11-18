import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

REPOSITORY = Path(__file__).resolve().parents[2]
RUNNER = REPOSITORY / "scripts" / "postprocess-before-upload.sh"


@unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "FFmpeg tools required")
class WorkflowFallbackTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory(prefix="itatiaia-workflow-test-")
        self.addCleanup(self.folder.cleanup)
        self.raw = Path(self.folder.name) / "raw.wav"
        self.environment_file = Path(self.folder.name) / "github_env"
        subprocess.run(
            [
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-f", "lavfi", "-i", "sine=frequency=900:duration=2",
                "-ac", "1", "-c:a", "pcm_s16le", str(self.raw),
            ],
            check=True,
        )

    def _run(self, matcher_path: Path, source: Path | None = None):
        source = source or self.raw
        env = dict(os.environ, GITHUB_ENV=str(self.environment_file), AUDPRINT_SCRIPT=str(matcher_path))
        return subprocess.run(
            ["bash", str(RUNNER), str(source), str(Path(self.folder.name) / "processed.wav"), str(Path(self.folder.name) / "postprocessing.json")],
            cwd=REPOSITORY,
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )

    def test_missing_fingerprinting_dependency_keeps_original_without_alerts(self):
        result = self._run(Path(self.folder.name) / "not-installed.py")

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(f"AUDIO_SOURCE={self.raw.resolve()}", self.environment_file.read_text())
        self.assertNotIn("::warning::", result.stdout + result.stderr)
        self.assertNotIn("::error::", result.stdout + result.stderr)

    def test_broken_fingerprint_matcher_keeps_original_without_alerts(self):
        matcher = Path(self.folder.name) / "broken.py"
        matcher.write_text("raise RuntimeError('temporary processing failure')\n")
        result = self._run(matcher)

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(f"AUDIO_SOURCE={self.raw.resolve()}", self.environment_file.read_text())
        self.assertNotIn("::warning::", result.stdout + result.stderr)

    def test_invalid_original_still_blocks_upload(self):
        invalid = Path(self.folder.name) / "invalid.wav"
        invalid.write_bytes(b"")
        result = self._run(Path(self.folder.name) / "not-installed.py", source=invalid)

        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(self.environment_file.exists())


if __name__ == "__main__":
    unittest.main()
