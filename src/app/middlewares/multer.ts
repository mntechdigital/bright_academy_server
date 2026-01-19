/* eslint-disable @typescript-eslint/no-explicit-any */
import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
import { NextFunction } from 'express';
import { ACCEPTED_FILE_TYPES, ACCEPTED_IMAGE_TYPES } from '../constant/acceptedType';

const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/files');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const imageStorage = multer.memoryStorage(); // Store images in memory for processing

// Filter function to accept only specific mimetypes for files
const fileFilter = function (req: any, file: any, cb: any) {
  if (ACCEPTED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

// Filter function to accept only specific mimetypes for images
const imageFilter = function (req: any, file: any, cb: any) {
  if (ACCEPTED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true); // Accept image
  } else {
    cb(new Error('Unsupported image type'), false);
  }
};

// multer instance for file uploads
export const fileUpload = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
});

// multer instance for image uploads
export const imageUpload = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
});

export const uploadImages = async (req: any, res: any, next: NextFunction) => {
  try {
    // Skip if no image files were uploaded
    if (!req.files && !req.file) {
      return next();
    }

    const files = req.files || [req.file];

    // If files array is empty, skip processing
    if (!files || files.length === 0) {
      return next();
    }

    const uploadPromises = files.map(async (file: any, index: number) => {
      // Added index
      const filename = `${file.fieldname}-${Date.now()}-${file.originalname}.webp`;
      const outputPath = `./public/images/${filename}`;

      if (file.mimetype === 'image/avif') {
        try {
          await sharp(file.buffer, { failOnError: false })
            .toFormat('webp', { quality: 80 })
            .toFile(outputPath);
        } catch (err) {
          console.error('Failed to convert AVIF:', err);
          throw new Error('AVIF conversion failed');
        }
      } else {
        // Normal processing for other formats
        await sharp(file.buffer).webp({ quality: 80 }).toFile(outputPath);
      }

      file.filename = filename;
      if (Array.isArray(req.files)) req.files[index].filename = filename;
    });

    await Promise.all(uploadPromises);

    // If it's a single file, update req.file
    if (req.file && files.length === 1) {
      req.file.filename = files[0].filename;
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing the images.');
  }
};