"use client";

import { useVideoProvider } from "../hooks/use-video-provider";

interface VideoEmbedProps {
  videoUrl: string | null;
  title: string;
}

/**
 * Video embed component that auto-detects provider (YouTube/Vimeo/Upload)
 * and renders the appropriate player.
 */
export function VideoEmbed({ videoUrl, title }: VideoEmbedProps) {
  const { provider, embedUrl } = useVideoProvider(videoUrl);

  if (!videoUrl || !embedUrl) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-[2px] border-2 border-border bg-bg-inset">
        <div className="text-center">
          <span className="font-mono text-[14px] text-text-3">
            {"// sem video"}
          </span>
        </div>
      </div>
    );
  }

  if (provider === "youtube" || provider === "vimeo") {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-[2px] border-2 border-border bg-bg-inset">
        {/* Hexagonal pattern background (visible during load) */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%234A9EFF' fill-opacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 size-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  // Native video player for uploads
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[2px] border-2 border-border bg-bg-inset">
      <video
        src={embedUrl}
        title={title}
        className="size-full"
        controls
        preload="metadata"
      />
    </div>
  );
}

export default VideoEmbed;
