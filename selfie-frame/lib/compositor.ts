/**
 * compositor.ts
 * Pure canvas compositing utility.
 * Canvas size: 1440 × 1080 (4:3)
 * - Draws selfie with "cover" fit (fills entire canvas, centered)
 * - Overlays the frame PNG on top
 */

export const CANVAS_WIDTH = 1440;
export const CANVAS_HEIGHT = 1080;

/**
 * Calculates cover-fit draw params so the source image fills the destination
 * rectangle without distortion, cropping edges as needed.
 */
function coverFit(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): { sx: number; sy: number; sw: number; sh: number } {
  const srcRatio = srcW / srcH;
  const dstRatio = dstW / dstH;

  let sw: number, sh: number, sx: number, sy: number;

  if (srcRatio > dstRatio) {
    // Source is wider than destination → crop left/right
    sh = srcH;
    sw = srcH * dstRatio;
    sx = (srcW - sw) / 2;
    sy = 0;
  } else {
    // Source is taller than destination → crop top/bottom
    sw = srcW;
    sh = srcW / dstRatio;
    sx = 0;
    sy = (srcH - sh) / 2;
  }

  return { sx, sy, sw, sh };
}

/**
 * Composites selfie + frame onto a canvas and returns a data URL.
 * @param selfieDataUrl - base64 data URL from react-webcam screenshot
 * @param frameImg      - preloaded HTMLImageElement of the frame PNG
 * @returns Promise<string> - data URL of the final composite image
 */
export async function compositeImage(
  selfieDataUrl: string,
  frameImg: HTMLImageElement
): Promise<string> {
  return new Promise((resolve, reject) => {
    const selfieImg = new Image();
    selfieImg.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));

      // Step 1: Draw selfie with cover-fit
      const { sx, sy, sw, sh } = coverFit(
        selfieImg.naturalWidth,
        selfieImg.naturalHeight,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
      );
      ctx.drawImage(selfieImg, sx, sy, sw, sh, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Step 2: Overlay the frame (transparent areas reveal selfie)
      ctx.drawImage(frameImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      resolve(canvas.toDataURL("image/png", 1.0));
    };
    selfieImg.onerror = reject;
    selfieImg.src = selfieDataUrl;
  });
}

/**
 * Converts a data URL to a File object for the Web Share API.
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}
