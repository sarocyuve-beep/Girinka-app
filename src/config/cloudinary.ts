export type CloudinaryUploadResult = {
  secure_url?: string;
  url?: string;
  error?: string;
};

export const cloudinaryConfig = {
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'demo-cloud',
  uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? 'girinka_unsigned',
};

export async function uploadToCloudinary(
  fileUri: string,
  folder: string = 'documents'
): Promise<CloudinaryUploadResult> {
  if (!process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    return {
      url: fileUri,
      secure_url: fileUri,
    };
  }

  const fileName = fileUri.split('/').pop() ?? 'upload';
  const url = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${folder}/${fileName}`;

  return {
    url,
    secure_url: url,
  };
}
