"use client";

/**
 * High-fidelity, Apple-style UI sounds synthesized with the Web Audio API.
 *
 * Design goals: rich, soft, satisfying — layered sine partials with gentle
 * attack/release envelopes and a touch of lowpass warmth. No sawtooth/alarm
 * timbres, no harsh transients. Quiet by default so they feel premium, not loud.
 */

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
};

/**
 * Play a single soft "bell" partial: a sine tone through a lowpass filter with
 * a smooth exponential decay. Layer several of these for a rich, warm chord.
 */
function bell(
  ctx: AudioContext,
  {
    freq,
    start = 0,
    duration = 0.6,
    peak = 0.14,
    type = "sine",
    glideTo,
    cutoff = 3800,
  }: {
    freq: number;
    start?: number;
    duration?: number;
    peak?: number;
    type?: OscillatorType;
    glideTo?: number;
    cutoff?: number;
  },
) {
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(cutoff, t0);
  filter.Q.value = 0.6;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) {
    osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + duration * 0.5);
  }

  // Soft attack (~12ms) → long smooth exponential release. Feels natural, not clicky.
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/**
 * Success — a warm major "ding" that resolves upward. Root + fifth + octave
 * shimmer, softly stacked. Satisfying, rounded, not shouty.
 */
export const playSuccessSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    bell(ctx, { freq: 659.25, start: 0.0, duration: 0.5, peak: 0.13 });                 // E5
    bell(ctx, { freq: 987.77, start: 0.07, duration: 0.6, peak: 0.11 });                // B5
    bell(ctx, { freq: 1318.51, start: 0.07, duration: 0.7, peak: 0.05, cutoff: 6000 }); // E6 shimmer
  } catch {
    /* browser blocked audio */
  }
};

/**
 * Error — a soft, low, non-alarming "thud". Two muted low sines, gentle.
 * Communicates "no" without startling the user.
 */
export const playErrorSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    bell(ctx, { freq: 220, start: 0.0, duration: 0.32, peak: 0.12, cutoff: 1400 });   // A3
    bell(ctx, { freq: 164.81, start: 0.05, duration: 0.4, peak: 0.1, cutoff: 1200 }); // E3
  } catch {
    /* ignore */
  }
};

/**
 * Celebration — a gentle ascending three-note sparkle for deposits/wins.
 * Bright but rounded; rewarding, not "dancy".
 */
export const playConfettiSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    bell(ctx, { freq: 1046.5, start: 0.0, duration: 0.4, peak: 0.1 });                   // C6
    bell(ctx, { freq: 1318.51, start: 0.09, duration: 0.42, peak: 0.09 });               // E6
    bell(ctx, { freq: 1567.98, start: 0.18, duration: 0.7, peak: 0.08, cutoff: 6500 });  // G6 shimmer
  } catch {
    /* ignore */
  }
};

/**
 * Subtle tap — for lightweight interactions (copy, toggle). Very short & quiet.
 */
export const playTapSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    bell(ctx, { freq: 880, start: 0, duration: 0.12, peak: 0.06, cutoff: 3000 });
  } catch {
    /* ignore */
  }
};
