import { Request } from 'express';
import configs from '../configs';

// For single uploaded PDF file
export const getSinglePdfUrl = (
  req: Request,
  file: Express.Multer.File | undefined,
): string | null => {
  if (!file || !file.filename) return null;
  return `${req.protocol}://${req.get('host')}/files/${file.filename}`;
};

// For multiple uploaded PDF files
export const getMultiplePdfUrls = (
  req: Request,
  files: Express.Multer.File[] | undefined,
): string[] => {
  if (!files || files.length === 0) return [];
  return files.map((file) => {
    if (!file.filename) return '';
    return `${req.protocol}://${req.get('host')}/files/${file.filename}`;
  });
};

// For single stored filename (used when retrieving from DB)
export const getSinglePdfUrlFromFilename = (
  filename: string | undefined,
): string | null => {
  if (!filename) return null;
  return `${configs.serverUrl}/files/${filename}`;
};

// For multiple stored filenames (used when retrieving from DB)
export const getMultiplePdfUrlsFromFilenames = (
  filenames: string[] | undefined,
): string[] => {
  if (!filenames || filenames.length === 0) return [];
  return filenames.map((filename) => `${configs.serverUrl}/files/${filename}`);
};
