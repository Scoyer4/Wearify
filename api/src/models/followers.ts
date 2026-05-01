export type FollowStatus = 'pending' | 'accepted';

export type FollowRelationStatus = 'none' | 'pending' | 'accepted';

export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  status: FollowStatus;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export interface FollowActionResponse {
  status: FollowStatus;
}

export interface FollowStatusResponse {
  iFollow: FollowRelationStatus;
  followsMe: FollowRelationStatus;
}

export interface FollowCountsResponse {
  followers: number;
  following: number;
}

export interface PaginatedUsersResponse {
  items: PublicUser[];
  page: number;
  total: number;
  totalPages: number;
}

export interface PendingRequestsResponse {
  items: PublicUser[];
  page: number;
  total: number;
  totalPages: number;
}

export interface PrivacyUpdateResponse {
  isPrivate: boolean;
  promotedCount: number;
}
