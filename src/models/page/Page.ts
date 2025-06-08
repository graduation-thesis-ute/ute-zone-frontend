export interface Page {
  _id: string;
  name: string;
  description: string;
  avatarUrl?: string;
  coverUrl?: string;
  category: string;
  isPublished: boolean;
  isOwner: number;
  totalFollowers: number;
  status: number; // 1: active, 2: pending, 3: deleted
  createdAt: string;
  updatedAt: string;
  followers?: Array<{
    _id: string;
    user: {
      _id: string;
      displayName: string;
      avatarUrl?: string;
    };
    createdAt: string;
  }>;
}

export interface PageResponse {
  content: Page[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
} 