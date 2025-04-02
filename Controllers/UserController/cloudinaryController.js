import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: globalThis.process.env.CLOUDINARY_CLOUD_NAME,
  api_key: globalThis.process.env.CLOUDINARY_API_KEY,
  api_secret: globalThis.process.env.CLOUDINARY_API_SECRET
});

export const generateSignedUrl = async (req, res) => {
    try {
      const { publicId } = req.body;
      
      if (!publicId) {
        return res.status(400).json({ error: 'Public ID is required' });
      }
      
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      
      const signedUrl = cloudinary.utils.private_download_url(publicId, 'jpg', {
        type: 'authenticated',
        expires_at: expiresAt
      });
      
      res.json({ signedUrl });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      res.status(500).json({ error: 'Failed to generate signed URL' });
    }
  }

  export const uploadToCloudinary = async (req, res) => {
    try {
      const { fileData } = req.body;
      
      const uploadResult = await cloudinary.uploader.upload(fileData, {
        upload_preset: 'secure-media',
        folder: 'protected-content'
      });
      
      res.json({
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url
      });
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }