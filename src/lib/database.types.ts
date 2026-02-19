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

export interface DbBookAnalysis {
  id: string;
  book_id: string;
  user_id: string;
  ai_topics: string[];
  ai_themes: string[];
  ai_tags: string[];
  ai_summary: string | null;
  raw_response: Record<string, unknown> | null;
  model_used: string | null;
  analyzed_at: string;
}

export interface DbBookConnection {
  id: string;
  user_id: string;
  book_a_id: string;
  book_b_id: string;
  connection_type: string;
  strength: number;
  explanation: string | null;
  created_at: string;
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
