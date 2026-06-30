"use client";

import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const FALLBACK_FRAME_URL =
  process.env.NEXT_PUBLIC_FALLBACK_FRAME_URL || null;

interface UseFrameResult {
  frameUrl: string | null;
  frameImg: HTMLImageElement | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches the active frame URL from the CMS settings API,
 * then preloads it as an HTMLImageElement ready for canvas compositing.
 */
export function useFrame(): UseFrameResult {
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [frameImg, setFrameImg] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        let url: string | null = null;

        // Try fetching from CMS settings
        try {
          const res = await fetch(`${API_BASE}/api/settings`);
          if (res.ok) {
            const settings = await res.json();
            url = settings.selfie_frame_url || null;
          }
        } catch {
          console.warn("[useFrame] Could not reach CMS settings API");
        }

        // Fallback to env variable
        if (!url && FALLBACK_FRAME_URL) {
          url = FALLBACK_FRAME_URL;
        }

        if (!url) {
          if (!cancelled) {
            setError("No frame configured. Please upload a frame in the CMS.");
            setLoading(false);
          }
          return;
        }

        // Preload the image
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          if (!cancelled) {
            setFrameUrl(url);
            setFrameImg(img);
            setLoading(false);
          }
        };
        img.onerror = () => {
          if (!cancelled) {
            setError("Failed to load frame image. Please check the CMS.");
            setLoading(false);
          }
        };
        img.src = url;
      } catch (err) {
        if (!cancelled) {
          setError("Unexpected error loading frame.");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { frameUrl, frameImg, loading, error };
}
