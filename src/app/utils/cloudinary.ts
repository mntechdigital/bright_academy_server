import fs from 'fs';
import path from 'path';

const NOTICES_DIR = path.resolve('public', 'notices');

export const deleteNoticePdf = async (filename: string): Promise<void> => {
  try {
    const filePath = path.join(NOTICES_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Failed to delete notice PDF:', error);
  }
};
