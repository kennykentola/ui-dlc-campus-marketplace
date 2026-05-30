
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

export enum DeliveryMethod {
  MEETUP = 'Physical Meetup',
  PICKUP = 'Campus Pickup',
  HOSTEL = 'Hostel Drop-off',
  DIGITAL = 'Digital Delivery',
  COURIER_HUB = 'Shared Hub Delivery'
}

export enum LearningHub {
  IBADAN = 'Ibadan Hub (DLC)',
  LAGOS = 'Lagos Hub',
  ONLINE = 'Online (Digital Only)'
}

export enum ListingType {
  NORMAL = 'Normal Asset',
  COURSE_MATERIAL = 'Course Material',
  EXAM_PREP = 'Exam Prep',
  TEXTBOOK = 'Textbook'
}

export enum TransactionStatus {
  INITIATED = 'initiated',
  PAYMENT_SENT = 'payment_sent',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed'
}

export type TransactionType = 'sale' | 'exchange' | 'both' | 'knowledge_barter';

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
  completionRate?: number; // New metric
  responseTime?: string;    // New metric (e.g. "2 hours")
  lastActive?: string;
  phoneNumber?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  fintechHandles?: string;
  favorites?: string[]; // Array of product IDs
  blockedUserIds?: string[]; // Array of user IDs this user has blocked
  sellerStatus: SellerStatus;
  isSuspended?: boolean;
  notificationSettings?: NotificationSettings | string;
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
  // New features
  listingType?: ListingType;
  deliveryMethods?: DeliveryMethod[];
  viewCount?: number;
  learningHub?: LearningHub;
  isExamWeekSafe?: boolean;
  isSharedLogistics?: boolean;
  digitalFileUrl?: string;
  digitalFileName?: string;
}

export interface Transaction {
  $id: string;
  productId: string;
  productName: string;
  productImage?: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  amount: number;
  status: TransactionStatus;
  paymentProofUrl?: string;
  createdAt: string;
  updatedAt: string;
  disputeReason?: string;
  digitalFileUrl?: string;
  digitalFileName?: string;
}

export interface BuyerRequest {
  $id: string;
  userId: string;
  userName: string;
  itemNeeded: string;
  description: string;
  budget?: number;
  createdAt: string;
  isFulfilled: boolean;
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
  status?: 'pending' | 'investigating' | 'resolved' | 'dismissed';
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
  transactionId?: string; // Verification link
}

export interface Message {
  $id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  duration?: number;
  type: 'text' | 'audio' | 'file';
  createdAt: string;
  isRead?: boolean;
  reactions?: { [emoji: string]: string[] };
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
