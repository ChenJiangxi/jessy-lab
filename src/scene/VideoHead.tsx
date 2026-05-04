import { useEffect, useRef } from 'react';

type Props = {
  playing?: boolean;
  className?: string;
};

/**
 * Real-video avatar. Two alpha-channel sources are offered: a VP9-alpha
 * webm (Chrome / Firefox / Edge) and an HEVC-alpha hvc1 mov (Safari, iOS).
 * The recorded black backdrop is chroma-keyed out at encode time and the
 * alpha plane is gaussian-feathered so the silhouette dissolves into the
 * LineBackdrop instead of reading as a rectangle. A radial CSS mask
 * additionally softens the chest/neck area where the body extends to the
 * bottom of the source frame.
 */
export default function VideoHead({ playing = false, className }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (playing) {
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else {
      v.pause();
      try {
        v.currentTime = 0;
      } catch {
        /* some browsers throw if metadata isn't loaded yet */
      }
    }
  }, [playing]);

  // Tight fade only at the very bottom — just enough to round off the
  // chest cutoff at the bottom of the source frame without making the
  // whole figure read as "floating." Alpha handles the other three sides.
  const softMask =
    'linear-gradient(to bottom, black 0%, black 88%, transparent 100%)';

  return (
    <video
      ref={ref}
      muted
      playsInline
      loop
      preload="auto"
      poster="/face-poster.jpg"
      aria-hidden
      className={className ?? 'w-full h-full'}
      style={
        className
          ? undefined
          : {
              objectFit: 'cover',
              objectPosition: '50% 22%',
              maskImage: softMask,
              WebkitMaskImage: softMask,
            }
      }
    >
      <source src="/face-video.webm" type='video/webm; codecs="vp9"' />
    </video>
  );
}
