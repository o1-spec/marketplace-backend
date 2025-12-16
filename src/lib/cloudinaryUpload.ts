import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/**
 * Uploads an image file to Cloudinary and returns the secure URL.
 * @param file - The image file to upload.
 * @param folder - Optional folder name (default: 'scraplink').
 * @returns Promise<string> - The secure URL of the uploaded image.
 */
export const uploadImage = async (
  file: File,
  folder: string = 'scraplink'
): Promise<string> => {
  try {
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' }, // Resize to max 800x800
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};