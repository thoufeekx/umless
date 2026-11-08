// Pure scoring helpers, shared by the pipeline (server) and the result screen (browser). No Node imports here.
export const FILLERS = new Set(["um", "umm", "uh", "uhh", "uhm", "erm", "er", "ah", "ahh", "hmm", "mm", "mhm", "eh"]);
export const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9']/g, "");
export const isFiller = (t: string) => FILLERS.has(norm(t));

// Um Score, 0-100, higher = cleaner delivery. Calibrated so a polished speaker lands ~90+,
// a typical nervous one-take demo ~40-60.
export function umScore(x: { fillerCount: number; stumbleCount: number; deadAirSec: number; duration: number }): number {
  const minutes = Math.max(x.duration / 60, 0.1);
  const penalty = (x.fillerCount / minutes) * 2.5 + (x.stumbleCount / minutes) * 1 + (x.deadAirSec / Math.max(x.duration, 0.1)) * 50;
  return Math.max(0, Math.min(100, Math.round(100 - penalty)));
}
