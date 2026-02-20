export interface DbBook {
  id: string;
  user_id: string;
  title: string;
  authors: string[];
  topics: string[];
  themes: string[];
  tags: string[];
  year: number | null;
  rating: number | null;
  date_read: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbBookSuggestion {
  id: string;
  user_id: string;
  title: string;
  authors: string[];
  reason: string | null;
  related_book_ids: string[];
  dismissed: boolean;
  created_at: string;
}
