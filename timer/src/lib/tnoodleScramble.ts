// cubing.js's own docs say its worker isn't supported when the page is loaded
// over file:// (which is exactly how the Electron/Windows build serves the
// app - see electron/main.cjs's loadFile call), so `cubing/scramble` is never
// even imported in that case rather than relying on it to fail gracefully.
// This is a dynamic import gated by the protocol check below (not a static
// top-level import) so the cubing.js module graph is never loaded at all
// under file://. See https://js.cubing.net/cubing/scramble/#file-server-required
const isFileProtocol = typeof location !== 'undefined' && location.protocol === 'file:';

/**
 * Generates a scramble using cubing.js's WCA-compatible scrambler (the same
 * scrambling engine real WCA scrambling software is built on) instead of a
 * local approximation. Falls back to the given local generator if the
 * WASM-backed scrambler fails to load (or can't run at all, as under file://).
 */
export async function tnoodleScramble(eventId: string, fallback: () => string): Promise<string> {
  if (isFileProtocol) return fallback();
  try {
    const { randomScrambleForEvent } = await import('cubing/scramble');
    const alg = await randomScrambleForEvent(eventId);
    const text = alg.toString();
    return text.length > 0 ? text : fallback();
  } catch {
    return fallback();
  }
}
