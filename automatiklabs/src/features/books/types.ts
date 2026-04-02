// =============================================
// Book Recommendations Types — AutomatikClub
// =============================================

export interface Book {
  id: string;
  title: string;
  author_name: string | null;
  description: string | null;
  cover_url: string | null;
  purchase_url: string | null;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
