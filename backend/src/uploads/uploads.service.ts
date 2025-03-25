import { Injectable } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadsService {
  getImagePath(filename: string): string {
    return join(process.cwd(), 'uploads', filename);
  }

  deleteImage(filename: string): boolean {
    try {
      const filePath = this.getImagePath(filename);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}
