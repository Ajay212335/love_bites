export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  bio?: string;
  partnerId?: string;
  partnerName?: string;
  partnerEmail?: string;
  anniversaryDate?: string;
  createdAt: string;
}

export interface UserProfile extends UserAccount {
  preferences?: {
    notifications: boolean;
    darkMode: boolean;
    dietary?: string[];
  };
}

export type TaskCategory =
  | 'romance'
  | 'cooking'
  | 'morning'
  | 'night'
  | 'wellness'
  | 'fun'
  | 'custom';

export type TaskAssignee = 'me' | 'partner' | 'both';

export interface DailyTask {
  id: string;
  title: string;
  description?: string;
  photoUrl?: string;
  attachedByName?: string;
  time: string; // e.g. "08:30 AM", "07:00 PM"
  hour: number; // 0-23
  minute: number; // 0-59
  category: TaskCategory;
  assignedTo: TaskAssignee;
  creatorId: string;
  creatorName: string;
  isCompleted: boolean;
  completedAt?: string;
  completedByName?: string;
  createdAt?: string;
  date?: string; // YYYY-MM-DD
  lastNudgedAt?: string;
  notificationId?: string;
  streakCount?: number;
}

export interface NotificationLog {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  taskId?: string;
  read: boolean;
  type: 'task_alarm' | 'partner_nudge' | 'system';
}

export interface BiteItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  tags: string[];
  isFeatured?: boolean;
  priceLevel?: '$' | '$$' | '$$$' | '$$$$';
  duration?: string;
  locationOrType?: string;
  loveMeter?: number;
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  description?: string;
  count?: number;
}

export interface SpecialDate {
  id: string;
  userId?: string;
  partnerId?: string;
  title: string;
  date: string; // ISO format: YYYY-MM-DD
  notes?: string;
  createdByName?: string;
  createdAt: string;
}
