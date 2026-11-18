import unittest
from pathlib import Path

from processing.detect import (
    IntroMatch,
    choose_match,
    chunk_offsets,
    detect_intro,
    parse_matches,
)

SAMPLE_OUTPUT = (
    "Matched   35.1 s starting at   11.4 s in recording.wav "
    "to time    3.1 s in intro.wav with   841 of   970 common hashes at rank  0\n"
    "Matched   16.8 s starting at   31.0 s in recording.wav "
    "to time   13.4 s in intro.wav with    12 of   970 common hashes at rank  0\n"
)


class ParseMatchesTests(unittest.TestCase):
    def test_recovers_intro_beginning_from_real_audfprint_output(self):
        matches = parse_matches(SAMPLE_OUTPUT)

        self.assertEqual(len(matches), 2)
        self.assertAlmostEqual(matches[0].start_seconds, 8.3)
        self.assertEqual(matches[0].aligned_hashes, 841)
        self.assertEqual(matches[0].common_hashes, 970)
        self.assertAlmostEqual(matches[0].matched_seconds, 35.1)

    def test_unknown_output_does_not_create_a_false_match(self):
        self.assertEqual(parse_matches("No matches found\n"), [])


class ChooseMatchTests(unittest.TestCase):
    def test_selects_strong_match_and_adds_chunk_offset(self):
        match = choose_match(parse_matches(SAMPLE_OUTPUT), chunk_offset=840)

        self.assertIsNotNone(match)
        self.assertAlmostEqual(match.start_seconds, 848.3)

    def test_rejects_insufficient_hashes(self):
        weak = IntroMatch(30.0, 12, 120, 20.0)
        self.assertIsNone(choose_match([weak], chunk_offset=0))

    def test_rejects_insufficient_aligned_duration(self):
        weak = IntroMatch(30.0, 500, 700, 5.0)
        self.assertIsNone(choose_match([weak], chunk_offset=0))

    def test_rejects_low_alignment_ratio(self):
        weak = IntroMatch(30.0, 40, 1000, 20.0)
        self.assertIsNone(choose_match([weak], chunk_offset=0))

    def test_rejects_ambiguous_different_positions(self):
        first = IntroMatch(42.0, 100, 150, 35.0)
        second = IntroMatch(150.0, 90, 150, 35.0)
        self.assertIsNone(choose_match([first, second], chunk_offset=0))

    def test_rejects_cut_larger_than_safe_limit(self):
        strong = IntroMatch(3700.0, 200, 220, 30.0)
        self.assertIsNone(choose_match([strong], chunk_offset=0, max_cut_seconds=3600))


class ChunkOffsetsTests(unittest.TestCase):
    def test_overlaps_blocks_that_could_split_the_intro(self):
        self.assertEqual(list(chunk_offsets(1900, 900, 60)), [0, 840, 1680])

    def test_short_file_generates_one_block(self):
        self.assertEqual(list(chunk_offsets(120, 900, 60)), [0])

    def test_detector_rejects_overlap_shorter_than_current_reference(self):
        with self.assertRaisesRegex(ValueError, "overlap"):
            detect_intro(
                Path("not-needed.wav"),
                Path("not-needed.pklz"),
                Path("not-needed.py"),
                chunk_seconds=900,
                overlap_seconds=20,
            )


if __name__ == "__main__":
    unittest.main()
