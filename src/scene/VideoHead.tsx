import { useEffect, useRef } from 'react';

type Props = {
  src?: string;
  playing?: boolean;
  className?: string;
};

/**
 * Real-video avatar. The default source is `/face-video.webm` — a VP9
 * video with a true alpha channel (yuva420p), so the recorded background
 * is transparent and the LineBackdrop behind shows through. While
 * `playing` is true, plays on loop. When false, pauses and rewinds to
 * frame 0 so the head settles on a neutral pose. Muted so the page's
 * TTS audio is the only voice the visitor hears.
 */
export default function VideoHead({
  src = '/face-video.webm',
  playing = false,
  className,
}: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (playing) {
      // Some browsers reject play() if the gesture chain is broken;
      // it's fine to ignore — the next user-gesture turn will retry.
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else {
      v.pause();
      // Reset so the next "speaking" turn starts from the neutral frame
      // and we don't freeze on a mid-talk mouth shape.
      try {
        v.currentTime = 0;
      } catch {
        /* some browsers throw if metadata isn't loaded yet */
      }
    }
  }, [playing]);

  return (
    <video
      ref={ref}
      src={src}
      muted
      playsInline
      loop
      preload="auto"
      aria-hidden
      className={className ?? 'w-full h-full'}
      style={
        className
          ? undefined
          : {
              objectFit: 'cover',
              objectPosition: '50% 22%',
              // Soft-fade the bottom so dark clothing dissolves into the
              // backdrop instead of reading as a hard rectangle edge.
              maskImage:
                'linear-gradient(to bottom, black 0%, black 68%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, black 0%, black 68%, transparent 100%)',
            }
      }
    />
  );
}
