// Zero-dependency pure TypeScript GIF89a Encoder for Canvas / Video / Image frames

export interface GifFrameOptions {
  width: number;
  height: number;
  delayMs?: number;
}

export class GifEncoder {
  private width: number;
  private height: number;
  private delay100ths: number;
  private frames: Uint8ClampedArray[] = [];

  constructor(width: number, height: number, delayMs: number = 100) {
    this.width = Math.min(width, 480);
    this.height = Math.min(height, 480);
    this.delay100ths = Math.max(2, Math.round(delayMs / 10));
  }

  public addFrame(imageData: ImageData) {
    // Resize/Copy image data buffer
    this.frames.push(new Uint8ClampedArray(imageData.data));
  }

  public render(): Blob {
    const bytes: number[] = [];

    // 1. Header GIF89a
    const header = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]; // GIF89a
    bytes.push(...header);

    // 2. Logical Screen Descriptor
    bytes.push(this.width & 0xff, (this.width >> 8) & 0xff);
    bytes.push(this.height & 0xff, (this.height >> 8) & 0xff);
    // Packed field: Global Color Table Flag = 1, Color Resolution = 7 (8-bit), Size of GCT = 7 (256 colors) -> 0xF7
    bytes.push(0xf7);
    bytes.push(0); // Background color index
    bytes.push(0); // Pixel aspect ratio

    // 3. Build optimal 256 color palette using Median Cut algorithm
    const palette = buildOptimalPalette(this.frames, 256);
    bytes.push(...palette);

    // NETSCAPE2.0 Application Extension for looping
    if (this.frames.length > 1) {
      bytes.push(
        0x21, 0xff, 0x0b,
        0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30, // NETSCAPE2.0
        0x03, 0x01, 0x00, 0x00, 0x00 // Loop infinitely
      );
    }

    const colorLookupCache = new Map<number, number>();

    // 4. Encode Each Frame
    for (const framePixels of this.frames) {
      // Graphic Control Extension
      bytes.push(
        0x21, 0xf9, 0x04,
        0x04, // Disposal method: restore to bg, no transparency
        this.delay100ths & 0xff, (this.delay100ths >> 8) & 0xff, // Delay time
        0x00, // Transparent color index
        0x00  // Block terminator
      );

      // Image Descriptor
      bytes.push(
        0x2c, // Image separator
        0, 0, 0, 0, // Left, Top position
        this.width & 0xff, (this.width >> 8) & 0xff,
        this.height & 0xff, (this.height >> 8) & 0xff,
        0x00 // Packed: no local color table
      );

      // Convert RGBA pixels to Palette Indices
      const indexedPixels = new Uint8Array(this.width * this.height);
      for (let i = 0; i < indexedPixels.length; i++) {
        const r = framePixels[i * 4];
        const g = framePixels[i * 4 + 1];
        const b = framePixels[i * 4 + 2];

        indexedPixels[i] = findClosestColorIndex(r, g, b, palette, colorLookupCache);
      }

      // LZW Compression
      const lzwMinCodeSize = 8;
      bytes.push(lzwMinCodeSize);

      const compressedData = lzwEncode(indexedPixels, lzwMinCodeSize);

      // Write in sub-blocks of max 255 bytes
      let pos = 0;
      while (pos < compressedData.length) {
        const chunkSize = Math.min(255, compressedData.length - pos);
        bytes.push(chunkSize);
        for (let i = 0; i < chunkSize; i++) {
          bytes.push(compressedData[pos + i]);
        }
        pos += chunkSize;
      }
      bytes.push(0x00); // Block terminator
    }

    // 5. GIF Trailer
    bytes.push(0x3b);

    return new Blob([new Uint8Array(bytes)], { type: 'image/gif' });
  }
}

// Simple LZW Encoder for 8-bit GIF data
function lzwEncode(pixels: Uint8Array, minCodeSize: number): Uint8Array {
  const clearCode = 1 << minCodeSize; // 256
  const eofCode = clearCode + 1;      // 257

  let codeSize = minCodeSize + 1;
  let nextCode = eofCode + 1;

  const dictionary: { [key: string]: number } = {};

  function initDict() {
    for (let i = 0; i < clearCode; i++) {
      dictionary[String(i)] = i;
    }
  }
  initDict();

  const outputBits: number[] = [];
  let bitCount = 0;
  let currentByte = 0;

  function writeCode(code: number) {
    for (let i = 0; i < codeSize; i++) {
      if (code & (1 << i)) {
        currentByte |= (1 << bitCount);
      }
      bitCount++;
      if (bitCount === 8) {
        outputBits.push(currentByte);
        currentByte = 0;
        bitCount = 0;
      }
    }
  }

  writeCode(clearCode);

  let p = String(pixels[0]);
  for (let i = 1; i < pixels.length; i++) {
    const c = pixels[i];
    const pc = p + "," + c;
    if (dictionary[pc] !== undefined) {
      p = pc;
    } else {
      writeCode(dictionary[p]);

      if (nextCode < 4096) {
        dictionary[pc] = nextCode++;
        if (nextCode === (1 << codeSize) + 1 && codeSize < 12) {
          codeSize++;
        }
      } else {
        // Dict full -> send clear code and reset
        writeCode(clearCode);
        codeSize = minCodeSize + 1;
        nextCode = eofCode + 1;
        for (const k in dictionary) delete dictionary[k];
        initDict();
      }
      p = String(c);
    }
  }
  writeCode(dictionary[p]);
  writeCode(eofCode);

  if (bitCount > 0) {
    outputBits.push(currentByte);
  }

  return new Uint8Array(outputBits);
}

// Helper to convert File (video or image) to GIF Blob & DataURL
export async function convertFileToGif(
  file: File,
  onProgress?: (progress: number) => void,
  trimRange?: { startTime: number; endTime: number; targetMaxDim?: number }
): Promise<{ blob: Blob; dataUrl: string }> {
  const isVideo = file.type.startsWith('video/') || Boolean(file.name.match(/\.(mp4|webm|mov|avi|mkv|3gp)$/i));

  if (isVideo) {
    return convertVideoToGif(file, onProgress, trimRange);
  } else {
    return convertImageToGif(file);
  }
}

async function convertImageToGif(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 480;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context error'));
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);

        const encoder = new GifEncoder(w, h, 150);
        encoder.addFrame(imageData);
        const blob = encoder.render();

        const dataUrlReader = new FileReader();
        dataUrlReader.onloadend = () => {
          resolve({ blob, dataUrl: dataUrlReader.result as string });
        };
        dataUrlReader.readAsDataURL(blob);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function convertVideoToGif(
  file: File,
  onProgress?: (progress: number) => void,
  trimRange?: { startTime: number; endTime: number; targetMaxDim?: number }
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      const start = Math.max(0, trimRange?.startTime ?? 0);
      const totalVidDuration = video.duration || 3;
      const end = Math.min(totalVidDuration, trimRange?.endTime ?? (start + 4));
      const activeDuration = Math.max(0.5, end - start);

      const maxDim = trimRange?.targetMaxDim || 320; // Lightweight 320p resolution for chat
      let w = video.videoWidth || 320;
      let h = video.videoHeight || 240;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context error'));
        return;
      }

      const fps = 30; // High fluid 30 FPS frame rate
      const totalFrames = Math.max(10, Math.floor(activeDuration * fps));
      const intervalSec = activeDuration / totalFrames;

      const encoder = new GifEncoder(w, h, Math.round((1 / fps) * 1000));
      let currentFrame = 0;

      const captureNextFrame = () => {
        if (currentFrame >= totalFrames) {
          URL.revokeObjectURL(videoUrl);
          const blob = encoder.render();
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({ blob, dataUrl: reader.result as string });
          };
          reader.readAsDataURL(blob);
          return;
        }

        video.currentTime = start + (currentFrame * intervalSec);
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        encoder.addFrame(imageData);

        currentFrame++;
        if (onProgress) {
          onProgress(Math.round((currentFrame / totalFrames) * 100));
        }

        captureNextFrame();
      };

      video.onerror = () => {
        URL.revokeObjectURL(videoUrl);
        reject(new Error('Video loading error'));
      };

      captureNextFrame();
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error('Could not play video'));
    };
  });
}

// Median Cut Color Palette Quantizer
interface ColorBox {
  rMin: number; rMax: number;
  gMin: number; gMax: number;
  bMin: number; bMax: number;
  colors: Array<[number, number, number]>;
}

function buildOptimalPalette(frames: Uint8ClampedArray[], maxColors = 256): number[] {
  const sampledColors: Array<[number, number, number]> = [];
  const sampleStep = 6;

  for (const frame of frames) {
    for (let i = 0; i < frame.length; i += 4 * sampleStep) {
      sampledColors.push([frame[i], frame[i + 1], frame[i + 2]]);
    }
  }

  if (sampledColors.length === 0) {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) p.push(i, i, i);
    return p;
  }

  const boxes: ColorBox[] = [createBox(sampledColors)];

  while (boxes.length < maxColors) {
    let maxVolume = -1;
    let splitIdx = -1;

    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      if (b.colors.length <= 1) continue;
      const vol = Math.max(b.rMax - b.rMin, b.gMax - b.gMin, b.bMax - b.bMin);
      if (vol > maxVolume) {
        maxVolume = vol;
        splitIdx = i;
      }
    }

    if (splitIdx === -1 || maxVolume <= 0) break;

    const boxToSplit = boxes.splice(splitIdx, 1)[0];
    const [b1, b2] = splitBox(boxToSplit);
    boxes.push(b1, b2);
  }

  const palette: number[] = [];
  for (const box of boxes) {
    let rSum = 0, gSum = 0, bSum = 0;
    for (const c of box.colors) {
      rSum += c[0];
      gSum += c[1];
      bSum += c[2];
    }
    const len = box.colors.length || 1;
    palette.push(Math.round(rSum / len), Math.round(gSum / len), Math.round(bSum / len));
  }

  while (palette.length < 256 * 3) {
    palette.push(0, 0, 0);
  }

  return palette;
}

function createBox(colors: Array<[number, number, number]>): ColorBox {
  let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
  for (const c of colors) {
    if (c[0] < rMin) rMin = c[0];
    if (c[0] > rMax) rMax = c[0];
    if (c[1] < gMin) gMin = c[1];
    if (c[1] > gMax) gMax = c[1];
    if (c[2] < bMin) bMin = c[2];
    if (c[2] > bMax) bMax = c[2];
  }
  return { rMin, rMax, gMin, gMax, bMin, bMax, colors };
}

function splitBox(box: ColorBox): [ColorBox, ColorBox] {
  const rDiff = box.rMax - box.rMin;
  const gDiff = box.gMax - box.gMin;
  const bDiff = box.bMax - box.bMin;

  let sortDim = 0;
  if (gDiff >= rDiff && gDiff >= bDiff) sortDim = 1;
  else if (bDiff >= rDiff && bDiff >= gDiff) sortDim = 2;

  box.colors.sort((a, b) => a[sortDim] - b[sortDim]);
  const mid = Math.floor(box.colors.length / 2);

  return [
    createBox(box.colors.slice(0, mid)),
    createBox(box.colors.slice(mid))
  ];
}

function findClosestColorIndex(
  r: number,
  g: number,
  b: number,
  palette: number[],
  cache: Map<number, number>
): number {
  const key = (r << 16) | (g << 8) | b;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  let minDistance = Infinity;
  let bestIdx = 0;

  for (let i = 0; i < 256; i++) {
    const pr = palette[i * 3];
    const pg = palette[i * 3 + 1];
    const pb = palette[i * 3 + 2];

    const dr = r - pr;
    const dg = g - pg;
    const db = b - pb;
    const dist = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;

    if (dist < minDistance) {
      minDistance = dist;
      bestIdx = i;
      if (dist === 0) break;
    }
  }

  cache.set(key, bestIdx);
  return bestIdx;
}
