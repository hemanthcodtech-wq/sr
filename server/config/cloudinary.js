const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

/**
 * Upload a file buffer or base64 data to Cloudinary
 * If Cloudinary keys are placeholders, returns a high quality fallback CDN URL
 */
const uploadToCloudinary = async (fileBuffer, folder = 'multivendor_ecommerce', originalname = 'upload') => {
  const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'demo_cloud' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== '123456789012345';

  if (!isCloudinaryConfigured) {
    // Return high quality curated placeholder image
    return {
      secure_url: `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80`,
      public_id: `mock_${Date.now()}`,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
};
