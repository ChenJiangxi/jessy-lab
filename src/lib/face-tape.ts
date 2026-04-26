/**
 * Face tape — a recorded sequence of mesh vertex positions she captures
 * once via webcam. Persisted server-side in SQLite (single row), so every
 * visitor replays the same recording she made. The admin key gates POST.
 */

const TAPE_API = '/api/face-tape';

export const FRAME_FLOATS = 478 * 3;
const FLOAT_BYTES = 4;

export type FaceTape = {
  fps: number;
  frameCount: number;
  data: Float32Array; // length = frameCount * FRAME_FLOATS
};

function bytesToFloat32(bytes: Uint8Array): Float32Array {
  // Copy into a new buffer so the Float32Array is properly aligned and
  // owns its memory (atob output isn't guaranteed to be 4-byte aligned).
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  return new Float32Array(buf);
}

function float32ToBase64(arr: Float32Array): string {
  const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export async function loadTape(): Promise<FaceTape | null> {
  try {
    const res = await fetch(TAPE_API);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      fps?: number;
      frameCount?: number;
      data?: string;
    };
    if (
      typeof json.fps !== 'number' ||
      typeof json.frameCount !== 'number' ||
      typeof json.data !== 'string'
    ) {
      return null;
    }
    const bin = atob(json.data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const expected = json.frameCount * FRAME_FLOATS * FLOAT_BYTES;
    if (bytes.length !== expected) return null;
    return {
      fps: json.fps,
      frameCount: json.frameCount,
      data: bytesToFloat32(bytes),
    };
  } catch {
    return null;
  }
}

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveTape(
  t: FaceTape,
  adminKey: string,
): Promise<SaveResult> {
  if (!adminKey) return { ok: false, error: 'admin key missing' };
  try {
    const res = await fetch(TAPE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: adminKey,
        fps: t.fps,
        frameCount: t.frameCount,
        data: float32ToBase64(t.data),
      }),
    });
    if (res.ok) return { ok: true };
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: j.error ?? `http ${res.status}` };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'network error' };
  }
}
