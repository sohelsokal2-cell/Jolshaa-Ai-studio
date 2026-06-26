export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profilePhoto: string;
  coverPhoto?: string;
  bio?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  gender?: string;
  friends?: string[];
  blockedUsers?: string[];
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  sender: User | string;
  receiver: User | string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type VisibilityType = 'public' | 'friends' | 'onlyme';

export interface Reaction {
  user: User;
  type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
}

export interface Post {
  id: string;
  author: User;
  text: string;
  media: string[];
  feeling?: string;
  taggedUsers: User[];
  visibility: VisibilityType;
  reactions: Reaction[];
  postedIn?: {
    type: 'profile' | 'group' | 'page';
    refId?: string;
  };
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  commentCount?: number;
}

export interface Comment {
  id: string;
  post: string; // post ID
  author: User;
  text: string;
  parentComment?: string; // parent comment ID
  replies?: Comment[];
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  coverPhoto?: string;
  privacy: 'public' | 'private';
  creator: User;
  admins: User[];
  members: User[];
  pendingRequests: User[];
  createdAt: string;
}

export interface Page {
  id: string;
  name: string;
  description?: string;
  profilePhoto?: string;
  coverPhoto?: string;
  category?: string;
  creator: User;
  admins: User[];
  followers: User[];
  createdAt: string;
}

export interface Story {
  id: string;
  author: User;
  media: string;
  mediaType: 'image' | 'video';
  viewers: string[]; // User IDs
  createdAt: string;
  expiresAt: string;
}

export interface StoryGroup {
  user: User;
  stories: Story[];
  allSeen: boolean;
}

export interface Album {
  id: string;
  owner: string; // User ID
  title: string;
  photos: string[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  isGroup: boolean;
  groupName?: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: Message;
}

export interface Message {
  id: string;
  conversation: string; // conversation ID
  sender: User;
  text?: string;
  media?: string;
  readBy: string[]; // User IDs
  createdAt: string;
}

export interface Notification {
  id: string;
  recipient: string; // User ID
  sender: User;
  type: 'friend_request' | 'comment' | 'reaction' | 'tag' | 'message' | 'group_invite';
  relatedPost?: string;
  relatedComment?: string;
  isRead: boolean;
  createdAt: string;
}
