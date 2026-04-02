// =============================================
// Newsletter Types — AutomatikClub
// =============================================

export type NewsletterStatus = "draft" | "sent";

export interface Newsletter {
  id: string;
  title: string;
  slug: string;
  content_html: string | null;
  status: NewsletterStatus;
  sent_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscriber {
  email: string;
  user_id: string | null;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export interface NewsletterWithMeta extends Newsletter {
  author_name: string | null;
}
