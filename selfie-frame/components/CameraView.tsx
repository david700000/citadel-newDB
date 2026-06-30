"use client";

import React, { useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";

interface CameraViewProps {
  onCapture: (dataUrl: string) => void;
  active: boolean;
}

const VIDEO_CONSTRAINTS = {
  facingMode: "user",
  aspectRatio: 4 / 3,
  width: { ideal: 1440 },
  height: { ideal: 1080 },
};

export function CameraView({ onCapture, active }: CameraViewProps) {
  const webcamRef = useRef<Webcam>(null);

  const capture = useCallback(() => {
    const screenshot = webcamRef.current?.getScreenshot({
      width: 1440,
      height: 1080,
    });
    if (screenshot) {
      onCapture(screenshot);
    }
  }, [onCapture]);

  if (!active) return null;

  return (
    <div className="camera-wrapper">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/png"
        screenshotQuality={1}
        videoConstraints={VIDEO_CONSTRAINTS}
        mirrored={true}
        className="camera-feed"
        onUserMediaError={(err) => console.error("Camera error:", err)}
      />
      {/* Capture button */}
      <div className="capture-btn-container">
        <button
          id="capture-btn"
          onClick={capture}
          className="capture-btn"
          aria-label="Take selfie"
        >
          <span className="capture-btn-ring" />
          <span className="capture-btn-core" />
        </button>
      </div>
    </div>
  );
}
