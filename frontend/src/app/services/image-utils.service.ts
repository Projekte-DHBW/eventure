import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ImageUtilsService {
  constructor() {}

  /**
   * Returns the appropriate URL for an image
   * @param coverImageUrl The image URL or filename
   * @param category The event category (used for fallback images)
   * @returns The complete image URL
   */
  getImageUrl(
    coverImageUrl: string | null | undefined,
    category: string,
  ): string {
    // If no image, use a fallback
    if (!coverImageUrl) {
      return `https://source.unsplash.com/300x200/?${category.toLowerCase()}`;
    }

    // Check if it's already a complete URL
    if (
      coverImageUrl.startsWith('http://') ||
      coverImageUrl.startsWith('https://')
    ) {
      return coverImageUrl;
    }

    if (!coverImageUrl.startsWith('/uploads/')) {
      return `http://localhost:3000/uploads/images/${coverImageUrl}`;
    }

    // It's already a proper path
    return coverImageUrl;
  }
}
