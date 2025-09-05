/**
 * Compresses an image file using Jimp to the specified size and returns as blob
 * Uses dynamic import to load Jimp only when needed
 */
export async function compressImage(file: File, maxSize: number = 250, quality: number = 0.8): Promise<Blob> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  try {
    // Dynamically import Jimp only when needed
    const { Jimp } = await import(/* webpackChunkName: "image-processing" */ 'jimp');

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Read image with Jimp
    const image = await Jimp.read(arrayBuffer);

    // Get original dimensions
    const { width, height } = image.bitmap;

    // Calculate how to crop to square (center crop)
    const size = Math.min(width, height);
    const x = Math.floor((width - size) / 2);
    const y = Math.floor((height - size) / 2);

    // Crop to square then resize
    const processedImage = image
      .crop({ x, y, w: size, h: size })
      .resize({ w: maxSize, h: maxSize });

    // Get a high-quality JPEG buffer from Jimp (WebP not supported in our Jimp types)
    const buffer = await processedImage.getBuffer('image/jpeg');

    // Convert JPEG blob to WebP using Canvas when available; fall back to JPEG
    const jpegBlob = new Blob([buffer as any], { type: 'image/jpeg' });

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const webpBlob = await new Promise<Blob | null>((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(jpegBlob);
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              resolve(blob);
            },
            'image/webp',
            quality
          );
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };
        img.src = url;
      });

      if (webpBlob) return webpBlob;
    }

    return jpegBlob;

  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
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
