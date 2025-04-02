export interface Page {
  _id: string;
  name: string;
  description: string;
  avatarUrl: string;
  coverUrl: string;
  category: string;
  createdAt: string;
  totalFollowers: number;
  isOwner: number;
  isPublished: boolean;
  updatedAt: string;
}

export interface PageResponse {
  content: Page[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
} 