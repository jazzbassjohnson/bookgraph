export interface Book {
  id: string;
  title: string;
  authors: string[];
  topics: string[];
  themes: string[];
  tags: string[];
  year?: number;
  rating?: number;
  dateRead?: string;
  notes?: string;
}

export type AttributeType = 'author' | 'topic' | 'theme' | 'tag';

export interface GraphNode {
  id: string;
  name: string;
  type: 'book' | AttributeType;
  bookId?: string;
  val?: number;
  color?: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: AttributeType;
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
