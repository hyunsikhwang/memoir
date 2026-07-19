/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

export interface Memory {
  id?: string;
  title: string;
  content: string;
  createdAt: number;
  date: string; // YYYY-MM-DD
  tags: string[];
  media: {
    images: string[]; // Base64 image strings or image URLs
    videos: string[]; // YouTube URLs or direct video file URLs
    urls: string[];   // URL attachments
  };
  linkPreviews?: LinkPreview[];
  isFavorite?: boolean;
}

