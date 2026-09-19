export type SwitchType = 'blue' | 'brown' | 'red' | 'silent';

interface Profile {
  oscFreq: number;
  oscDecay: number;
  oscGain: number;
  noiseFreq: number;
  noiseGain: number;
  noiseDecay: number;
  noiseQ: number;
}

const PROFILES: Record<SwitchType, Profile> = {
  blue: { oscFreq: 900, oscDecay: 0.05, oscGain: 0.22, noiseFreq: 3200, noiseGain: 0.38, noiseDecay: 0.025, noiseQ: 2.2 },
  brown: { oscFreq: 480, oscDecay: 0.06, oscGain: 0.32, noiseFreq: 1800, noiseGain: 0.2, noiseDecay: 0.03, noiseQ: 1.6 },
  red: { oscFreq: 260, oscDecay: 0.08, oscGain: 0.42, noiseFreq: 900, noiseGain: 0.1, noiseDecay: 0.02, noiseQ: 1.2 },
  silent: { oscFreq: 150, oscDecay: 0.09, oscGain: 0.4, noiseFreq: 450, noiseGain: 0.05, noiseDecay: 0.015, noiseQ: 1 },
};

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function playKeySound(type: SwitchType): void {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return;
  const p = PROFILES[type];
  const audioCtx = getCtx();
  const now = audioCtx.currentTime;
  const jitter = 0.92 + Math.random() * 0.16;

  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(p.oscFreq * jitter, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, p.oscFreq * 0.4), now + p.oscDecay);
  oscGain.gain.setValueAtTime(0.0001, now);
  oscGain.gain.exponentialRampToValueAtTime(p.oscGain, now + 0.004);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, now + p.oscDecay);
  osc.connect(oscGain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + p.oscDecay + 0.02);

  const bufSize = Math.floor(audioCtx.sampleRate * 0.04);
  const buffer = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = p.noiseFreq * jitter;
  filter.Q.value = p.noiseQ;
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(p.noiseGain, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + p.noiseDecay);
  noise.connect(filter).connect(noiseGain).connect(audioCtx.destination);
  noise.start(now);
}
