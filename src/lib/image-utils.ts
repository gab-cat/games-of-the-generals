import { Jimp } from 'jimp';

/**
 * Compresses an image file using Jimp to the specified size and returns as blob
 */
export async function compressImage(file: File, maxSize: number = 250): Promise<Blob> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  try {
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
    
    // Convert to JPEG buffer
    const buffer = await processedImage.getBuffer('image/jpeg');
    
    // Return as blob (buffer should work directly)
    return new Blob([buffer as any], { type: 'image/jpeg' });
    
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
