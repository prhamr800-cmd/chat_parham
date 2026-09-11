/**
 * Utility for image optimization, WebP conversion, and generating SEO-friendly descriptive alt tags.
 */

export interface OptimizedImageResult {
  blob: Blob;
  name: string;
  type: string;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  descriptiveAlt: string;
}

/**
 * Generates an SEO-rich, descriptive alt text for any uploaded or displayed image in Privo.
 */
export function generateDescriptiveImageAlt(fileName?: string, context?: string, senderNickname?: string): string {
  const cleanName = fileName ? fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ") : "تصویر گفتگو";
  const parts: string[] = [];

  parts.push(`تصویر ارسالی: ${cleanName}`);
  if (senderNickname) {
    parts.push(`ارسال شده توسط ${senderNickname}`);
  }
  if (context) {
    parts.push(`در ${context}`);
  }
  parts.push("پیام‌رسان فوق امن پریوو | Privo Secure Messenger E2EE");

  return parts.join(" — ");
}

/**
 * Converts images (JPEG, PNG, BMP) to highly compressed, high-fidelity WebP format in client browser.
 * Keeps GIFs and SVGs as-is to preserve animations/vectors.
 */
export async function optimizeImageToWebP(
  file: File,
  quality: number = 0.88,
  maxWidth: number = 2560,
  maxHeight: number = 2560,
  senderNickname?: string,
  context?: string
): Promise<OptimizedImageResult> {
  const isWebPConvertible = file.type.startsWith("image/") && !file.type.includes("gif") && !file.type.includes("svg+xml");
  const descriptiveAlt = generateDescriptiveImageAlt(file.name, context, senderNickname);

  if (!isWebPConvertible) {
    return {
      blob: file,
      name: file.name,
      type: file.type,
      width: 0,
      height: 0,
      originalSize: file.size,
      optimizedSize: file.size,
      compressionRatio: 0,
      descriptiveAlt,
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Scale down if dimensions exceed maximum while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({
          blob: file,
          name: file.name,
          type: file.type,
          width: img.width,
          height: img.height,
          originalSize: file.size,
          optimizedSize: file.size,
          compressionRatio: 0,
          descriptiveAlt,
        });
        return;
      }

      // Smooth bicubic resampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // If WebP is not smaller (rare), keep original
            resolve({
              blob: file,
              name: file.name,
              type: file.type,
              width,
              height,
              originalSize: file.size,
              optimizedSize: file.size,
              compressionRatio: 0,
              descriptiveAlt,
            });
            return;
          }

          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const newName = `${baseName}.webp`;
          const ratio = Math.round((1 - blob.size / file.size) * 100);

          resolve({
            blob,
            name: newName,
            type: "image/webp",
            width,
            height,
            originalSize: file.size,
            optimizedSize: blob.size,
            compressionRatio: ratio,
            descriptiveAlt,
          });
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        blob: file,
        name: file.name,
        type: file.type,
        width: 0,
        height: 0,
        originalSize: file.size,
        optimizedSize: file.size,
        compressionRatio: 0,
        descriptiveAlt,
      });
    };

    img.src = objectUrl;
  });
}
