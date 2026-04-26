/**
 * TTS playback — single shared <audio> element. (sway-lab pattern.)
 *
 * Why this shape:
 *   - One audio element on the whole page → physically impossible for two
 *     TTS clips to overlap. stopAudio() runs at the start of every speak()
 *     so a second message cleanly cuts off the first.
 *   - We TTS the full assistant message ONCE after streaming finishes,
 *     not sentence-by-sentence. Eliminates queue-races and end-event
 *     ordering bugs.
 *   - unlockAudio() must be called inside a user gesture (the send button
 *     click) to satisfy iOS / Safari / WeChat autoplay policies.
 *
 * Amplitude monitoring still works: we createMediaElementSource(audio)
 * once and tap an AnalyserNode for RMS readings while audio plays.
 */

let sharedAudio: HTMLAudioElement | null = null;
let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let mediaSource: MediaElementAudioSourceNode | null = null;
let unlocked = false;
let currentBlobUrl: string | null = null;
let ampRafId = 0;
let ampSubscriber: ((amp: number) => void) | null = null;

// A tiny silent MP3 payload — playing it inside a click handler is what
// actually unlocks the audio element on iOS / Safari / WeChat.
const SILENCE_MP3 =
  'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA' +
  '//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAB9gC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7' +
  'u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7///////////////////////////////////////' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7UGQAA/AAADSAAAAAIAAANIAAAARMQXlBAAAgAAA0gAAABE' +
  'xBeSAAAAAAD/+1BkAIP4AABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAAQ=';

function getSharedAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = 'auto';
  }
  return sharedAudio;
}

function getCtx(): AudioContext | null {
  if (audioCtx) return audioCtx;
  const Ctor =
    (window.AudioContext as typeof AudioContext | undefined) ??
    ((window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext);
  if (!Ctor) return null;
  audioCtx = new Ctor();
  return audioCtx;
}

function ensureAnalyser(): void {
  if (analyser) return;
  const ctx = getCtx();
  const audio = getSharedAudio();
  if (!ctx) return;
  try {
    mediaSource = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.6;
    mediaSource.connect(analyser);
    analyser.connect(ctx.destination);
  } catch {
    // createMediaElementSource throws if called twice on the same element —
    // safe to swallow because the previous wiring is still good.
  }
}

/**
 * Call inside a click / touch handler to unlock playback on Safari / iOS /
 * WeChat. Idempotent.
 */
export function unlockAudio(): void {
  if (unlocked) return;
  unlocked = true;

  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
  ensureAnalyser();

  const audio = getSharedAudio();
  audio.src = SILENCE_MP3;
  audio.volume = 0;
  const p = audio.play();
  if (p && typeof p.then === 'function') {
    p.then(() => {
      audio.pause();
      audio.volume = 1;
      audio.currentTime = 0;
    }).catch(() => {
      /* unlock failed — speak() will surface the error if needed */
    });
  }
}

/** Strip markdown / link / parenthetical-direction noise before sending to TTS. */
export function cleanForTTS(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // [label](url) → label
    .replace(/\*\*(.+?)\*\*/g, '$1')           // **bold**
    .replace(/`([^`]+)`/g, '$1')               // `code`
    .replace(/https?:\/\/[^\s)]+/g, '')        // bare URLs
    .replace(/……|…/g, '，')                    // ellipses → soft pause
    .replace(/——|—/g, '，')
    .replace(/（[^）]*）/g, '')                 // (stage directions)
    .replace(/\([^)]*\)/g, '')
    .replace(/[\r\n]+/g, '。')
    .replace(/\s+/g, ' ')
    .trim();
}

function revokeBlobUrl(): void {
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
}

/** Cut off whatever's playing, immediately. */
export function stopAudio(): void {
  cancelAnimationFrame(ampRafId);
  if (sharedAudio) {
    sharedAudio.pause();
    sharedAudio.currentTime = 0;
  }
  if (ampSubscriber) ampSubscriber(0);
  revokeBlobUrl();
}

type SpeakOpts = {
  onAmplitude?: (amp: number) => void;
  /** Fires when audio actually starts playing (the `playing` event). Use
   *  this to start synced visuals so they don't run during the
   *  fetch/decode latency before audio actually begins. */
  onAudioStart?: () => void;
  signal?: AbortSignal;
};

/**
 * Speak `text` from start to finish. Cancels any prior playback first.
 * Resolves when the clip ends, the abort signal fires, or an error occurs.
 */
export async function speak(text: string, opts: SpeakOpts = {}): Promise<void> {
  const cleaned = cleanForTTS(text);
  if (!cleaned) return;

  // Cut off previous clip before starting a new one.
  stopAudio();

  ensureAnalyser();
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') void ctx.resume();

  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: cleaned }),
    signal: opts.signal,
  });
  if (!res.ok) throw new Error(`tts ${res.status}`);

  if (opts.signal?.aborted) return;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  currentBlobUrl = url;

  const audio = getSharedAudio();
  audio.src = url;
  audio.currentTime = 0;
  audio.volume = 1;

  ampSubscriber = opts.onAmplitude ?? null;

  const sample = () => {
    if (!analyser) {
      ampRafId = requestAnimationFrame(sample);
      return;
    }
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i]! - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    ampSubscriber?.(Math.min(1, rms * 3));
    ampRafId = requestAnimationFrame(sample);
  };

  await new Promise<void>((resolve, reject) => {
    const onEnd = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error('audio playback error'));
    };
    const onAbort = () => {
      audio.pause();
      cleanup();
      resolve();
    };
    const cleanup = () => {
      cancelAnimationFrame(ampRafId);
      ampSubscriber?.(0);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onErr);
      opts.signal?.removeEventListener('abort', onAbort);
      revokeBlobUrl();
    };
    audio.addEventListener('ended', onEnd, { once: true });
    audio.addEventListener('error', onErr, { once: true });
    if (opts.onAudioStart) {
      audio.addEventListener('playing', opts.onAudioStart, { once: true });
    }
    opts.signal?.addEventListener('abort', onAbort, { once: true });

    const p = audio.play();
    if (p && typeof p.then === 'function') {
      p.catch((err) => {
        cleanup();
        reject(err instanceof Error ? err : new Error('audio.play failed'));
      });
    }
    sample();
  });
}
