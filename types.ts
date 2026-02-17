
export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin'
}

export enum ProductStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SOLD = 'sold'
}

export enum SellerStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

export type TransactionType = 'sale' | 'exchange' | 'both';

export interface NotificationSettings {
  emailMessages: boolean;
  emailReviews: boolean;
  emailVerification: boolean;
}

export interface UserProfile {
  $id: string;
  userId: string;
  name: string;
  email: string;
  matricNumber: string;
  department: string;
  level: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  averageRating?: number;
  totalReviews?: number;
  phoneNumber?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  fintechHandles?: string;
  favorites?: string[]; // Array of product IDs
  blockedUserIds?: string[]; // Array of user IDs this user has blocked
  sellerStatus: SellerStatus;
  isSuspended?: boolean;
  notificationSettings?: NotificationSettings;
}

export interface Product {
  $id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sellerId: string;
  sellerName: string;
  status: ProductStatus;
  imageUrls: string[]; 
  createdAt: string;
  buyerId?: string;
  purchaseDate?: string;
  isFlagged?: boolean;
  transactionType?: TransactionType;
  exchangeTerms?: string;
  buyNowPrice?: number;
  isNegotiable?: boolean;
}

export interface ProductReport {
  $id: string;
  productId: string;
  productName: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  description: string;
  createdAt: string;
}

export interface Review {
  $id: string;
  productId: string;
  productName: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Message {
  $id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text?: string;
  audioUrl?: string;
  duration?: number;
  type: 'text' | 'audio';
  createdAt: string;
  isRead?: boolean;
  reactions?: { [emoji: string]: string[] }; // emoji -> array of userIds
}

export interface Conversation {
  $id: string;
  participantIds: string[];
  lastMessage: string;
  updatedAt: string;
  otherParticipant?: UserProfile;
}

export enum Category {
  ELECTRONICS = 'Electronics',
  BOOKS = 'Books',
  FASHION = 'Fashion',
  SERVICES = 'Services',
  ACCOMMODATION = 'Accommodation',
  STATIONERY = 'Stationery',
  LAND = 'Land',
  BAGS = 'Bags',
  SHOES = 'Shoes',
  CLOTHES = 'Clothes'
}
