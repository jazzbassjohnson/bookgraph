export interface Book {
  id: string;
  user_id: string;
  title: string;
  authors: string[];
  topics: string[];
  themes: string[];
  tags: string[];
  year?: number;
  rating?: number;
  dateRead?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BookAnalysis {
  id: string;
  book_id: string;
  ai_topics: string[];
  ai_themes: string[];
  ai_tags: string[];
  ai_summary: string | null;
  raw_response?: Record<string, unknown> | null;
  model_used?: string | null;
  analyzed_at: string;
}

export interface BookConnection {
  id: string;
  book_a_id: string;
  book_b_id: string;
  connection_type: 'thematic' | 'stylistic' | 'topical' | 'influence' | 'author';
  strength: number;
  explanation: string | null;
}

export interface BookSuggestion {
  id: string;
  title: string;
  authors: string[];
  reason: string | null;
  related_book_ids: string[];
  dismissed: boolean;
}

export interface BookWithAnalysis extends Book {
  analysis?: BookAnalysis;
}

export type AttributeType = 'author' | 'topic' | 'theme' | 'tag';

export type LinkType = AttributeType | 'ai_connection';

export interface GraphNode {
  id: string;
  name: string;
  type: 'book' | AttributeType | 'suggestion';
  source?: 'user' | 'ai';
  bookId?: string;
  suggestionId?: string;
  val?: number;
  color?: string;
  opacity?: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: LinkType;
  strength?: number;
  explanation?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface EdgeToggles {
  author: boolean;
  topic: boolean;
  theme: boolean;
  tag: boolean;
  ai_connection: boolean;
}

export interface LibraryData {
  books: Book[];
  version: number;
}
