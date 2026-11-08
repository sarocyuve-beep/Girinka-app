// Cloudinary — used for photos/documents (cow photos, beneficiary ID scans,
// committee-decision supporting documents) while we're in the free/testing
// phase (free tier: 25 GB storage + 25 GB bandwidth/month).
//
// SETUP (one-time):
// 1. Create a free account at https://cloudinary.com/users/register/free
// 2. Dashboard shows your "Cloud name" — put it below (or in .env).
// 3. Settings -> Upload -> Upload presets -> Add upload preset ->
//    set "Signing Mode" to "Unsigned" -> name it (e.g. "girinka_unsigned")
//    and put that name below. Unsigned presets are the standard way to
//    upload straight from a mobile app without exposing your API secret.
// 4. Optional: restrict the preset to an "Uploads" folder per module
//    (cows/, beneficiaries/, documents/) using the "Folder" field.

const CLOUD_NAME = "dn2jjb315";
const UPLOAD_PRESET = "GirinkApp";

export type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  bytes: number;
  format: string;
};

/**
 * Uploads a local file (from expo-image-picker / expo-document-picker) to
 * Cloudinary and returns the hosted URL to store on the record (e.g.
 * Animal.photo, CommitteeDecision.supportingDocument).
 *
 * @param localUri  file:// URI from the picker
 * @param folder    logical sub-folder, e.g. "cows", "beneficiaries", "documents"
 * @param resourceType "image" for photos, "auto" for PDFs/other documents
 */
export async function uploadToCloudinary(
  localUri: string,
  folder: string,
  resourceType: "image" | "auto" = "image"
): Promise<CloudinaryUploadResult> {
  if (CLOUD_NAME === "REPLACE_ME") {
    throw new Error(
      "Cloudinary is not configured yet — set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME (see src/config/cloudinary.ts)."
    );
  }

  const fileName = localUri.split("/").pop() ?? `upload-${Date.now()}`;
  const form = new FormData();

  // Important: For React Native, the file object must match this structure
  const fileData = {
    uri: localUri,
    type: 'image/jpeg',
    name: fileName,
  };

  form.append("file", fileData as any);
  form.append("upload_preset", UPLOAD_PRESET.trim());
  form.append("folder", `girinka/${folder}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME.trim()}/image/upload`,
    {
      method: "POST",
      body: form,
      headers: {
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloudinary upload failed (${response.status}): ${text}`);
  }

  const json = await response.json();
  return {
    secureUrl: json.secure_url,
    publicId: json.public_id,
    bytes: json.bytes,
    format: json.format,
  };
}
