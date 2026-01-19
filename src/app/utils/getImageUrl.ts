import { Request } from 'express';
import configs from '../configs';

export const getSingleImageUrl = (
  req: Request,
  file: Express.Multer.File | undefined,
): string | null => {
  if (!file || !file.filename) return null; // Check if filename exists
  return `${req.protocol}://${req.get('host')}/images/${file.filename}`;
};

export const getMultipleImageUrls = (
  req: Request,
  files: Express.Multer.File[] | undefined,
): string[] => {
  if (!files || files.length === 0) return [];
  return files.map((file) => {
    if (!file.filename) return '';
    return `${req.protocol}://${req.get('host')}/images/${file.filename}`;
  });
};

export const getSingleImageUrlFromFilename = (
  filename: string | undefined,
): string | null => {
  if (!filename) return null;
  return `${configs.serverUrl}/images/${filename}`;
};

export const getMultipleImageUrlsFromFilenames = (
  filenames: string[] | undefined,
): string[] => {
  if (!filenames || filenames.length === 0) return [];
  return filenames.map((filename) => `${configs.serverUrl}/images/${filename}`);
};
