"use client";

import { useMemo } from "react";
import type { VideoProvider } from "../types";

const YOUTUBE_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]{11}/;
const VIMEO_REGEX = /^(https?:\/\/)?(www\.)?vimeo\.com\/\d+/;

export function detectVideoProvider(url: string | null): VideoProvider | null {
  if (!url) return null;
  if (YOUTUBE_REGEX.test(url)) return "youtube";
  if (VIMEO_REGEX.test(url)) return "vimeo";
  return "upload";
}

export function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/
  );
  return match?.[1] ?? null;
}

export function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match?.[1] ?? null;
}

export function useVideoProvider(url: string | null) {
  return useMemo(() => {
    const provider = detectVideoProvider(url);
    let embedUrl: string | null = null;

    if (provider === "youtube" && url) {
      const id = extractYouTubeId(url);
      if (id) embedUrl = `https://www.youtube.com/embed/${id}`;
    } else if (provider === "vimeo" && url) {
      const id = extractVimeoId(url);
      if (id) embedUrl = `https://player.vimeo.com/video/${id}`;
    } else if (provider === "upload") {
      embedUrl = url;
    }

    return { provider, embedUrl };
  }, [url]);
}
