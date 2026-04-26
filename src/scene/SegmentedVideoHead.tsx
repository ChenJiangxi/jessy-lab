import { useEffect, useRef, useState } from 'react';
import {
  SelfieSegmentation,
  type Results,
} from '@mediapipe/selfie_segmentation';

type Props = {
  src?: string;
  playing?: boolean;
};

/**
 * Real video → MediaPipe SelfieSegmentation per-frame mask → canvas with
 * a transparent background. The visitor sees only her cut-out shape; the
 * video's real background is gone, replaced by whatever sits behind this
 * component (LineBackdrop in V2).
 *
 * The hidden <video> is the segmenter's source. The displayed <canvas>
 * is what the user actually sees. While `playing` is false we pause the
 * video at frame 0 — segmentation keeps painting that single frame.
 */
export default function SegmentedVideoHead({
  src = '/face-video.mp4',
  playing = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const segmenterRef = useRef<SelfieSegmentation | null>(null);
  const playingRef = useRef(playing);
  const [segReady, setSegReady] = useState(false);
  const [segFailed, setSegFailed] = useState(false);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // Init segmenter once.
  useEffect(() => {
    let cancelled = false;
    const segmenter = new SelfieSegmentation({
      locateFile: (file) => `/selfie_segmentation/${file}`,
    });
    segmenter.setOptions({ modelSelection: 1, selfieMode: false });
    segmenter.onResults((results: Results) => {
      const cv = canvasRef.current;
      if (!cv) return;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      const { width: w, height: h } = cv;
      ctx.save();
      ctx.clearRect(0, 0, w, h);
      // Draw mask, then composite source-in to keep only the masked area.
      ctx.drawImage(results.segmentationMask, 0, 0, w, h);
      ctx.globalCompositeOperation = 'source-in';
      ctx.drawImage(results.image, 0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    });

    segmenter
      .initialize()
      .then(() => {
        if (cancelled) {
          segmenter.close().catch(() => {});
          return;
        }
        segmenterRef.current = segmenter;
        setSegReady(true);
      })
      .catch((e) => {
        console.error('SelfieSegmentation init failed:', e);
        if (!cancelled) setSegFailed(true);
      });

    return () => {
      cancelled = true;
      segmenter.close().catch(() => {});
      segmenterRef.current = null;
    };
  }, []);

  // Drive the video play/pause state.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else {
      v.pause();
      try {
        v.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
  }, [playing]);

  // Per-frame: feed segmenter the current video frame.
  useEffect(() => {
    if (!segReady) return;
    const v = videoRef.current;
    const cv = canvasRef.current;
    if (!v || !cv) return;

    const setCanvasSize = () => {
      cv.width = v.videoWidth || 480;
      cv.height = v.videoHeight || 640;
    };
    if (v.readyState >= 1) setCanvasSize();
    v.addEventListener('loadedmetadata', setCanvasSize);

    let raf = 0;
    let busy = false;
    let lastTime = -1;

    // Always paint the current frame at least once so the neutral-pose
    // frame is visible before the user triggers playback.
    let firstFrameDone = false;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (v.readyState < 2) return;
      const segmenter = segmenterRef.current;
      if (!segmenter || busy) return;
      const cur = v.currentTime;
      // Send a frame if: we haven't yet (firstFrameDone), OR playing is
      // true AND the video time advanced. Skip duplicates so we don't
      // burn CPU on the same paused frame forever.
      if (!firstFrameDone) {
        firstFrameDone = true;
      } else {
        if (!playingRef.current) return;
        if (cur === lastTime) return;
      }
      lastTime = cur;
      busy = true;
      segmenter
        .send({ image: v })
        .catch(() => {})
        .finally(() => {
          busy = false;
        });
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener('loadedmetadata', setCanvasSize);
    };
  }, [segReady]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        loop
        preload="auto"
        aria-hidden
        className={
          segReady && !segFailed
            ? 'absolute opacity-0 pointer-events-none w-1 h-1'
            : 'w-full h-full object-cover'
        }
      />
      {segReady && !segFailed && (
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ objectFit: 'cover', display: 'block' }}
        />
      )}
    </div>
  );
}
