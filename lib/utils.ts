export function formatFileName(name: string): string {
  const match = name.match(/itatiaia_(\d{4}-\d{2}-\d{2})/);
  if (match) {
    const [year, month, day] = match[1].split("-");
    return `${day}/${month}/${year}`;
  }
  return name.replace(".aac", "");
}

export function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds) || isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;