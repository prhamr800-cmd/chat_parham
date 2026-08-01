export interface User {
  id: string;
  username: string;
  nickname: string;
  bio: string;
  avatarColor: string;
  avatarEmoji: string;
  avatarUrl?: string; // URL for custom uploaded profile picture
  theme: string;
  twoFactorSecret: string;
  twoFactorPIN?: string;
  isTwoFactorEnabled: boolean;
  publicKey: string; // Public key for E2EE
  blockedUsers: string[]; // List of user IDs blocked by this user
  isOnline: boolean;
  lastSeen: string; // ISO timestamp
  // Advanced privacy settings
  privacyLastSeen?: 'everyone' | 'nobody';
  privacyOnlineStatus?: 'everyone' | 'nobody';
  privacyProfilePhoto?: 'everyone' | 'nobody';
  privacyAllowMessages?: 'everyone' | 'nobody';
  privacyAllowGroups?: 'everyone' | 'nobody';
  privacySendSeen?: boolean;
  privacyHideTyping?: boolean;
  appPasscode?: string;
  isAppPasscodeEnabled?: boolean;
  bubbleBorderFrame?: 'default' | 'heart' | 'fiery' | 'bow' | 'emerald_glow' | 'cyber_neon';
  role?: string;
  subscriptionTier?: 'free' | 'plus';
  subscriptionPlan?: string;
  subscriptionEndDate?: string;
  grantedByAdmin?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderNickname: string;
  content: string; // End-to-end encrypted string (or regular if fallback)
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  voiceDuration?: number; // duration in seconds
  timestamp: string; // ISO timestamp
  reactions: { [emoji: string]: string[] }; // Emoji to array of User IDs
  type: 'text' | 'file' | 'voice';
  isEncrypted: boolean;
  status: 'sending' | 'sent' | 'read';
  // Advanced messaging features
  isEdited?: boolean;
  replyToId?: string;
  replyToContent?: string;
  replyToSender?: string;
  isForwarded?: boolean;
  forwardedFrom?: string;
  isPinned?: boolean;
  deletedFor?: string[];
  senderSubscriptionTier?: string;
  bubbleBorderFrame?: string;
}

export interface Chat {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'channel';
  creatorId: string;
  avatarColor: string;
  avatarEmoji: string;
  members: string[]; // User IDs
  description?: string;
  disableAiIntervention?: boolean;
  aiAccessMode?: 'disabled' | 'summary_only' | 'full_participation';
  lastMessageText?: string;
  lastMessageTime?: string;
}

export interface AbuseReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  messageId?: string;
  reason: string;
  timestamp: string;
}

export interface OutgoingQueueItem {
  id: string;
  chatId: string;
  senderId: string;
  senderNickname: string;
  content: string;
  rawContent: string;
  type: 'text' | 'file' | 'voice';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  voiceDuration?: number;
  isEncrypted: boolean;
  status: 'sending' | 'sent';
  replyToId?: string;
  timestamp: string;
  retries: number;
}

export type ThemePreset = 'telegram' | 'sapphire' | 'emerald' | 'amethyst' | 'cyberpunk' | 'mono';

export interface ChatState {
  currentUser: User | null;
  activeChatId: string | null;
  chats: Chat[];
  messages: { [chatId: string]: Message[] };
  users: { [userId: string]: Partial<User> };
  theme: ThemePreset;
  onlineUsers: Set<string>;
}
