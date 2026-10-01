/**
 * Client-side image compression utility.
 * Optimizes user-uploaded covers, screenshots, and avatars to WebP.
 * Bounded to max 1600px long-side (256px for avatars) and <= 300KB.
 */

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  savingsText: string;
}

export interface CompressionOptions {
  isAvatar?: boolean;
  maxDimension?: number;
  maxSizeBytes?: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    isAvatar = false,
    maxDimension = isAvatar ? 256 : 1600,
    maxSizeBytes = isAvatar ? 80 * 1024 : 300 * 1024,
  } = options;

  const originalSize = file.size;

  // Do not recompress SVG or animated GIF
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savingsText: 'Vector/GIF format preserved',
    };
  }

  // Load image bitmap or HTMLImageElement
  let sourceWidth = 0;
  let sourceHeight = 0;
  let source: ImageBitmap | HTMLImageElement;

  try {
    if (typeof createImageBitmap !== 'undefined') {
      source = await createImageBitmap(file);
      sourceWidth = source.width;
      sourceHeight = source.height;
    } else {
      source = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
      sourceWidth = source.width;
      sourceHeight = source.height;
    }
  } catch {
    // Return original if decoding fails
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savingsText: 'Original preserved',
    };
  }

  // Calculate target dimensions
  let targetWidth = sourceWidth;
  let targetHeight = sourceHeight;

  if (isAvatar) {
    targetWidth = 256;
    targetHeight = 256;
  } else {
    const longSide = Math.max(sourceWidth, sourceHeight);
    if (longSide > maxDimension) {
      const ratio = maxDimension / longSide;
      targetWidth = Math.round(sourceWidth * ratio);
      targetHeight = Math.round(sourceHeight * ratio);
    }
  }

  // Render to canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savingsText: 'Original preserved',
    };
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (isAvatar) {
    // Center square crop
    const minDim = Math.min(sourceWidth, sourceHeight);
    const srcX = (sourceWidth - minDim) / 2;
    const srcY = (sourceHeight - minDim) / 2;
    ctx.drawImage(source, srcX, srcY, minDim, minDim, 0, 0, 256, 256);
  } else {
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  }

  // Iterative compression stepping from quality 0.82 down to 0.60
  let quality = 0.82;
  let bestBlob: Blob | null = null;
  const targetMime = 'image/webp';

  const getBlob = (q: number): Promise<Blob | null> => {
    return new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), targetMime, q);
    });
  };

  while (quality >= 0.55) {
    const candidate = await getBlob(quality);
    if (candidate) {
      bestBlob = candidate;
      if (candidate.size <= maxSizeBytes) {
        break; // Within target budget
      }
    }
    quality -= 0.06;
  }

  if (!bestBlob) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savingsText: 'Original preserved',
    };
  }

  // Generate webp file name with original base
  const originalBase = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const newName = `${originalBase}.webp`;
  const compressedFile = new File([bestBlob], newName, { type: targetMime });

  const compressedSize = compressedFile.size;
  const savingsPct = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));
  const savingsText =
    compressedSize < originalSize
      ? `Optimized ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (-${savingsPct}%)`
      : `${formatBytes(compressedSize)} (WebP)`;

  return {
    file: compressedFile,
    originalSize,
    compressedSize,
    savingsText,
  };
}
