// Types for the Free Content Hub feature

export interface Lead {
  id: string;
  email: string;
  name: string;
  whatsapp: string;
  isStudent: boolean;
  totalCoins: number;
  createdAt: string;
  updatedAt: string;
}

export interface FreeContent {
  id: string;
  slug: string;
  title: string;
  description: string;
  unlockKey: string;
  coinReward: number;
  coinCost: number;
  contentData: ContentData;
  publishedAt: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
}

export interface ContentData {
  type: string;
  intro: string;
  items: ContentItem[];
  htmlContent?: string;
}

export interface ContentItem {
  title: string;
  emoji: string;
  description: string;
  link: string;
  linkLabel: string;
  tip: string;
}

export interface ContentUnlock {
  id: string;
  leadEmail: string;
  contentId: string;
  method: 'key' | 'coins' | 'student';
  unlockedAt: string;
}

export interface CoinTransaction {
  id: string;
  leadEmail: string;
  contentId: string | null;
  amount: number;
  type: 'earned' | 'spent';
  description: string | null;
  createdAt: string;
}

export interface LeadActivityEntry {
  id: string;
  leadEmail: string;
  action: string;
  contentId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// API response types
export interface CheckEmailResponse {
  status: 'student' | 'lead' | 'new';
  lead?: Lead;
}

export interface UnlockResponse {
  unlocked: boolean;
  coinsEarned: number;
  isStudent: boolean;
  method: 'key' | 'coins' | 'student';
}

export interface BalanceResponse {
  coins: number;
  unlockedContentIds: string[];
}

export interface MarketplaceContent extends FreeContent {
  isUnlocked: boolean;
}
