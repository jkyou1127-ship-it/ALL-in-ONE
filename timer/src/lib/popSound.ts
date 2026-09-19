// Synthesizes a satisfying "pop" sound with the Web Audio API - no external
// audio file needed, so it works offline and in the packaged desktop app.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function playPop(): void {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return;
  const audioCtx = getCtx();
  const now = audioCtx.currentTime;

  // low "thock" - a sine that drops in pitch fast
  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  osc.type = 'sine';
  const startFreq = 170 + Math.random() * 70;
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, startFreq * 0.3), now + 0.08);
  oscGain.gain.setValueAtTime(0.0001, now);
  oscGain.gain.exponentialRampToValueAtTime(0.55, now + 0.006);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
  osc.connect(oscGain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.12);

  // short filtered noise burst - the "snap" transient
  const bufferSize = Math.floor(audioCtx.sampleRate * 0.03);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 1200 + Math.random() * 400;
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.28, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
  noise.connect(noiseFilter).connect(noiseGain).connect(audioCtx.destination);
  noise.start(now);
}
