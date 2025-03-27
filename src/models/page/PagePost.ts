export interface PagePost {
  _id: string;
  content: string;
  imageUrls?: string[];
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
  page: {
    _id: string;
    name: string;
    avatarUrl: string | null;
  };
  user: {
    _id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface PagePostResponse {
  content: PagePost[];
  totalPages: number;
  totalElements: number;
} 