"use client";

import React, { useState, useCallback, useEffect } from "react";
import { CameraView } from "@/components/CameraView";
import { ActionButtons } from "@/components/ActionButtons";
import { LoadingScreen, ErrorScreen } from "@/components/LoadingScreen";
import { useFrame } from "@/hooks/useFrame";
import { compositeImage, dataUrlToFile } from "@/lib/compositor";

type AppState = "loading" | "error" | "camera" | "processing" | "result";

export default function Home() {
  const { frameImg, loading, error } = useFrame();

  const [appState, setAppState] = useState<AppState>("loading");
  const [resultDataUrl, setResultDataUrl] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Transition from loading to camera once frame is ready
  useEffect(() => {
    if (loading) {
      setAppState("loading");
    } else if (error) {
      setAppState("error");
    } else {
      setAppState("camera");
    }
  }, [loading, error]);

  // Detect Web Share API with file support
  useEffect(() => {
    setCanShare(
      typeof navigator !== "undefined" &&
        !!navigator.share &&
        !!navigator.canShare
    );
  }, []);

  const handleCapture = useCallback(
    async (selfieDataUrl: string) => {
      if (!frameImg) return;
      setAppState("processing");
      try {
        const composite = await compositeImage(selfieDataUrl, frameImg);
        setResultDataUrl(composite);
        setAppState("result");
      } catch (err) {
        console.error("Compositing error:", err);
        setAppState("error");
      }
    },
    [frameImg]
  );

  const handleRetake = useCallback(() => {
    setResultDataUrl(null);
    setAppState("camera");
  }, []);

  const handleDownload = useCallback(() => {
    if (!resultDataUrl) return;
    const a = document.createElement("a");
    a.href = resultDataUrl;
    a.download = `selfie-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [resultDataUrl]);

  const handleShare = useCallback(async () => {
    if (!resultDataUrl || !navigator.share) return;
    setSharing(true);
    try {
      const file = dataUrlToFile(resultDataUrl, `selfie-${Date.now()}.png`);
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Photo",
          text: "Check out my photo! 📸",
        });
      } else {
        await navigator.share({ title: "My Photo", text: "Check out my photo!" });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Share error:", err);
      }
    } finally {
      setSharing(false);
    }
  }, [resultDataUrl]);

  return (
    <main className="app-main">
      {appState === "loading" && (
        <LoadingScreen message="Preparing your photo experience..." />
      )}
      {appState === "error" && (
        <ErrorScreen message={error || "Something went wrong. Please try again."} />
      )}
      {appState === "camera" && (
        <div className="scene">
          <div className="scene-header">
            <h1 className="scene-title">Take Your Photo</h1>
            <p className="scene-subtitle">Position yourself and tap capture</p>
          </div>
          <div className="viewport">
            <CameraView onCapture={handleCapture} active />
          </div>
        </div>
      )}
      {appState === "processing" && (
        <LoadingScreen message="Creating your photo..." />
      )}
      {appState === "result" && resultDataUrl && (
        <div className="scene">
          <div className="scene-header">
            <h1 className="scene-title">Your Photo is Ready!</h1>
            <p className="scene-subtitle">Download or share it with the world</p>
          </div>
          <div className="viewport">
            <div className="result-wrapper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultDataUrl}
                alt="Your composited selfie"
                className="result-image"
              />
            </div>
          </div>
          <ActionButtons
            onRetake={handleRetake}
            onDownload={handleDownload}
            onShare={handleShare}
            canShare={canShare}
            sharing={sharing}
          />
        </div>
      )}
    </main>
  );
}
