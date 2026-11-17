/**
 * Resizes an image in the browser with a canvas and returns a WebP blob
 * (JPEG where the browser can't encode WebP).
 *
 * - "square" (avatars): centre-crops to a square of maxSize.
 * - "fit" (attachments): keeps the whole image, longest side at most maxSize.
 *
 * This used to load Jimp (about 720 KB) just to crop and resize.
 */
export async function compressImage(
  file: File,
  maxSize: number = 250,
  quality: number = 0.8,
  mode: "square" | "fit" = "square",
): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }

  let bitmap: ImageBitmap;
  try {
    // Applies EXIF orientation, so phone photos come out upright.
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Failed to compress image");
  }

  try {
    const { width, height } = bitmap;
    let sx = 0;
    let sy = 0;
    let sw = width;
    let sh = height;
    let dw: number;
    let dh: number;

    if (mode === "square") {
      const side = Math.min(width, height);
      sx = Math.floor((width - side) / 2);
      sy = Math.floor((height - side) / 2);
      sw = side;
      sh = side;
      dw = dh = Math.min(maxSize, side);
    } else {
      const scale = Math.min(1, maxSize / Math.max(width, height));
      dw = Math.max(1, Math.round(width * scale));
      dh = Math.max(1, Math.round(height * scale));
    }

    const canvas = document.createElement("canvas");
    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to compress image");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, dw, dh);

    const toBlob = (type: string) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

    // Browsers that can't encode WebP hand back a PNG; use JPEG then.
    const webp = await toBlob("image/webp");
    if (webp && webp.type === "image/webp") return webp;
    const jpeg = await toBlob("image/jpeg");
    if (jpeg) return jpeg;
    throw new Error("Failed to compress image");
  } finally {
    bitmap.close();
  }
}

/**
 * Validates file size and type
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  // Check file size (max 5MB)
  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSizeInBytes) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  // Check supported formats
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
  if (!supportedTypes.includes(file.type)) {
    return { valid: false, error: 'Supported formats: JPEG, PNG, WebP, GIF, BMP' };
  }

  return { valid: true };
}
