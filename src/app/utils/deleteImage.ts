import fs from 'fs';
import path from 'path';
import { URL } from 'url';

export const deleteImage = (imageUrl: string) => {
  try {
    const url = new URL(imageUrl);
    const filename = path.basename(url.pathname);

    const fullPath = path.resolve(
      __dirname,
      '../../../public/images',
      filename,
    );

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    } else {
      console.warn(`${filename} not found.`);
    }
  } catch (err) {
    console.error('Error deleting file:', err);
  }
};
