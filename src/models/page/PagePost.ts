export interface PagePost {
  _id: string;
  content: string;
  imageUrls?: string[];
  createdAt: string;
  totalReactions: number;
  totalComments: number;
  totalShares: number;
  isLiked?: boolean;
  isOwner: number;
  page: {
    _id: string;
    name: string;
    avatarUrl: string | null;
    kind: string;
    category: string;
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