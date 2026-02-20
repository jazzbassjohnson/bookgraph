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

export interface BookSuggestion {
  id: string;
  title: string;
  authors: string[];
  reason: string | null;
  related_book_ids: string[];
  dismissed: boolean;
}

export type AttributeType = 'author' | 'topic' | 'theme' | 'tag';

export type LinkType = AttributeType;

export interface GraphNode {
  id: string;
  name: string;
  type: 'book' | AttributeType | 'suggestion';
  source?: 'user';
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
}

export interface LibraryData {
  books: Book[];
  version: number;
}
