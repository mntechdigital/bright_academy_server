import { v2 as cloudinary } from 'cloudinary';
import configs from '../configs';

// Configure the Cloudinary SDK from environment variables.
cloudinary.config({
  cloud_name: configs.cloudinaryCloudName,
  api_key: configs.cloudinaryApiKey,
  api_secret: configs.cloudinaryApiSecret,
});

// Upload a PDF (received as an in-memory buffer via multer.memoryStorage())
// directly to Cloudinary and return the secure URL. No file is ever written
// to the local filesystem, so this works on Vercel's read-only filesystem.
//
// IMPORTANT: PDFs must be uploaded as resource_type 'image' so Cloudinary's
// image pipeline (and its browser PDF viewer) can render them. Uploading as
// 'raw' produces a /raw/upload/ URL that is only meant for download and
// cannot be rendered -> "Failed to load PDF document".
export const uploadPdfToCloudinary = async (
  file: Express.Multer.File | undefined,
): Promise<string> => {
  console.log('Uploading PDF to Cloudinary:', {
    originalname: file?.originalname,
    mimetype: file?.mimetype,
    size: file?.size,
  });

  if (!file || !file.buffer) {
    console.error('No file buffer received for Cloudinary upload.');
    return '';
  }

  const publicId = `notice-${Date.now()}-${Math.round(Math.random() * 1e9)}`;

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'notices',
        resource_type: 'image', // renderable PDF (not 'raw')
        public_id: publicId,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        console.log('Cloudinary upload result:', {
          resource_type: result?.resource_type,
          format: result?.format,
          bytes: result?.bytes,
          secure_url: result?.secure_url,
          public_id: result?.public_id,
        });
        resolve(result?.secure_url ?? result?.url ?? '');
      },
    );

    uploadStream.end(file.buffer);
  });
};

// Delete a notice PDF from Cloudinary using its stored URL.
// The public id is derived from the URL: .../upload/<version>/<public_id>.<ext>
export const deleteNoticePdf = async (pdfUrl: string): Promise<void> => {
  try {
    if (!pdfUrl) {
      return;
    }

    const url = new URL(pdfUrl);
    const segments = url.pathname.split('/');
    const uploadIdx = segments.indexOf('upload');

    if (uploadIdx === -1) {
      return;
    }

    // Skip the 'upload' marker and the following version segment.
    let publicId = segments.slice(uploadIdx + 2).join('/');

    // Strip the trailing file extension.
    publicId = publicId.replace(/\.[^/.]+$/, '');

    if (!publicId) {
      return;
    }

    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (error) {
    console.error('Failed to delete notice PDF from Cloudinary:', error);
  }
};
