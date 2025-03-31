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
}

export interface PageResponse {
  content: Page[];
  totalPages: number;
  totalElements: number;
} 