"use client";

import React from "react";

interface ActionButtonsProps {
  onRetake: () => void;
  onDownload: () => void;
  onShare: () => void;
  canShare: boolean;
  sharing: boolean;
}

export function ActionButtons({
  onRetake,
  onDownload,
  onShare,
  canShare,
  sharing,
}: ActionButtonsProps) {
  return (
    <div className="action-buttons">
      {/* Retake */}
      <button
        id="retake-btn"
        onClick={onRetake}
        className="btn btn-secondary"
        aria-label="Retake photo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="btn-icon"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        Retake
      </button>

      {/* Download */}
      <button
        id="download-btn"
        onClick={onDownload}
        className="btn btn-primary"
        aria-label="Download photo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="btn-icon"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download
      </button>

      {/* Share — only shown if Web Share API available */}
      {canShare && (
        <button
          id="share-btn"
          onClick={onShare}
          className="btn btn-accent"
          aria-label="Share photo"
          disabled={sharing}
        >
          {sharing ? (
            <span className="btn-spinner" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="btn-icon"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          )}
          Share
        </button>
      )}
    </div>
  );
}
