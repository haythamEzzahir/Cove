import { v2 as cloudinary } from "cloudinary";

// Configure the Cloudinary SDK with credentials from env
const initCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
};

// Upload a base64 image to Cloudinary and return the secure URL
const uploadAvatar = async (base64Image) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary is not configured");
  }

  initCloudinary();

  const result = await cloudinary.uploader.upload(base64Image, {
    folder: "fintracker/avatars",
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
      { quality: "auto", fetch_format: "auto" }
    ]
  });

  return result.secure_url;
};

// Delete an avatar image from Cloudinary by its URL
const deleteAvatar = async (url) => {
  if (!url || !url.includes("cloudinary.com")) return;

  initCloudinary();

  try {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    const publicId = `fintracker-avatars/${filename.split(".")[0]}`;
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error.message);
  }
};

export { uploadAvatar, deleteAvatar };
