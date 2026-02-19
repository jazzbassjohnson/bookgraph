import type {
  BookWithAnalysis, BookConnection, BookSuggestion,
  GraphData, GraphNode, GraphLink, EdgeToggles, AttributeType,
} from './types';

const COLORS: Record<string, string> = {
  book: '#6366f1',
  author: '#f59e0b',
  topic: '#10b981',
  theme: '#ec4899',
  tag: '#8b5cf6',
  ai_connection: '#06b6d4',
  suggestion: '#6366f1',
};

export function buildGraphData(
  books: BookWithAnalysis[],
  edgeToggles: EdgeToggles,
  threshold: number,
  connections: BookConnection[] = [],
  suggestions: BookSuggestion[] = [],
  showSuggestions = false
): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const attributeBookCounts: Map<string, number> = new Map();

  // First pass: count how many books each attribute is connected to
  // Merge user + AI attributes (deduplicated)
  for (const book of books) {
    const allTopics = new Set([...book.topics, ...(book.analysis?.ai_topics || [])]);
    const allThemes = new Set([...book.themes, ...(book.analysis?.ai_themes || [])]);
    const allTags = new Set([...book.tags, ...(book.analysis?.ai_tags || [])]);

    if (edgeToggles.author) {
      for (const author of book.authors) {
        const id = `author:${author}`;
        attributeBookCounts.set(id, (attributeBookCounts.get(id) || 0) + 1);
      }
    }
    if (edgeToggles.topic) {
      for (const topic of allTopics) {
        const id = `topic:${topic}`;
        attributeBookCounts.set(id, (attributeBookCounts.get(id) || 0) + 1);
      }
    }
    if (edgeToggles.theme) {
      for (const theme of allThemes) {
        const id = `theme:${theme}`;
        attributeBookCounts.set(id, (attributeBookCounts.get(id) || 0) + 1);
      }
    }
    if (edgeToggles.tag) {
      for (const tag of allTags) {
        const id = `tag:${tag}`;
        attributeBookCounts.set(id, (attributeBookCounts.get(id) || 0) + 1);
      }
    }
  }

  // Filter attributes by threshold
  const validAttributes = new Set<string>();
  for (const [id, count] of attributeBookCounts) {
    if (count >= threshold) {
      validAttributes.add(id);
    }
  }

  // Create attribute nodes
  const attributeNodesSet = new Set<string>();

  function addAttributeNode(id: string, name: string, type: AttributeType, source?: 'user' | 'ai') {
    if (!attributeNodesSet.has(id) && validAttributes.has(id)) {
      attributeNodesSet.add(id);
      nodes.push({
        id,
        name,
        type,
        source,
        val: attributeBookCounts.get(id) || 1,
        color: COLORS[type],
      });
    }
  }

  // Create book nodes and links
  const bookIdSet = new Set<string>();
  for (const book of books) {
    const bookNodeId = `book:${book.id}`;
    bookIdSet.add(book.id);
    nodes.push({
      id: bookNodeId,
      name: book.title,
      type: 'book',
      bookId: book.id,
      val: 3,
      color: COLORS.book,
    });

    const allTopics = new Set([...book.topics, ...(book.analysis?.ai_topics || [])]);
    const allThemes = new Set([...book.themes, ...(book.analysis?.ai_themes || [])]);
    const allTags = new Set([...book.tags, ...(book.analysis?.ai_tags || [])]);

    if (edgeToggles.author) {
      for (const author of book.authors) {
        const attrId = `author:${author}`;
        if (validAttributes.has(attrId)) {
          addAttributeNode(attrId, author, 'author', 'user');
          links.push({ source: bookNodeId, target: attrId, type: 'author' });
        }
      }
    }

    if (edgeToggles.topic) {
      for (const topic of allTopics) {
        const attrId = `topic:${topic}`;
        if (validAttributes.has(attrId)) {
          const source = book.topics.includes(topic) ? 'user' : 'ai';
          addAttributeNode(attrId, topic, 'topic', source);
          links.push({ source: bookNodeId, target: attrId, type: 'topic' });
        }
      }
    }

    if (edgeToggles.theme) {
      for (const theme of allThemes) {
        const attrId = `theme:${theme}`;
        if (validAttributes.has(attrId)) {
          const source = book.themes.includes(theme) ? 'user' : 'ai';
          addAttributeNode(attrId, theme, 'theme', source);
          links.push({ source: bookNodeId, target: attrId, type: 'theme' });
        }
      }
    }

    if (edgeToggles.tag) {
      for (const tag of allTags) {
        const attrId = `tag:${tag}`;
        if (validAttributes.has(attrId)) {
          const source = book.tags.includes(tag) ? 'user' : 'ai';
          addAttributeNode(attrId, tag, 'tag', source);
          links.push({ source: bookNodeId, target: attrId, type: 'tag' });
        }
      }
    }
  }

  // Add AI connection links (direct book-to-book)
  if (edgeToggles.ai_connection) {
    for (const conn of connections) {
      if (bookIdSet.has(conn.book_a_id) && bookIdSet.has(conn.book_b_id)) {
        links.push({
          source: `book:${conn.book_a_id}`,
          target: `book:${conn.book_b_id}`,
          type: 'ai_connection',
          strength: conn.strength,
          explanation: conn.explanation ?? undefined,
        });
      }
    }
  }

  // Add suggestion nodes
  if (showSuggestions) {
    for (const suggestion of suggestions) {
      const suggestionNodeId = `suggestion:${suggestion.id}`;
      nodes.push({
        id: suggestionNodeId,
        name: suggestion.title,
        type: 'suggestion',
        suggestionId: suggestion.id,
        val: 2,
        color: COLORS.suggestion,
        opacity: 0.5,
      });

      // Link to related books
      for (const relatedId of suggestion.related_book_ids) {
        if (bookIdSet.has(relatedId)) {
          links.push({
            source: suggestionNodeId,
            target: `book:${relatedId}`,
            type: 'ai_connection',
            strength: 0.3,
          });
        }
      }
    }
  }

  return { nodes, links };
}

export function findRelatedBooks(book: BookWithAnalysis, allBooks: BookWithAnalysis[]): BookWithAnalysis[] {
  const related = new Set<string>();

  for (const other of allBooks) {
    if (other.id === book.id) continue;

    if (book.authors.some((a) => other.authors.includes(a))) {
      related.add(other.id);
      continue;
    }

    // Check user + AI topics combined
    const bookTopics = [...book.topics, ...(book.analysis?.ai_topics || [])];
    const otherTopics = [...other.topics, ...(other.analysis?.ai_topics || [])];
    if (bookTopics.some((t) => otherTopics.includes(t))) {
      related.add(other.id);
      continue;
    }

    const bookThemes = [...book.themes, ...(book.analysis?.ai_themes || [])];
    const otherThemes = [...other.themes, ...(other.analysis?.ai_themes || [])];
    if (bookThemes.some((t) => otherThemes.includes(t))) {
      related.add(other.id);
      continue;
    }

    const bookTags = [...book.tags, ...(book.analysis?.ai_tags || [])];
    const otherTags = [...other.tags, ...(other.analysis?.ai_tags || [])];
    if (bookTags.some((t) => otherTags.includes(t))) {
      related.add(other.id);
    }
  }

  return allBooks.filter((b) => related.has(b.id));
}

export function getConnectedBooks(attributeId: string, books: BookWithAnalysis[]): BookWithAnalysis[] {
  const [type, ...nameParts] = attributeId.split(':');
  const name = nameParts.join(':');

  return books.filter((book) => {
    switch (type) {
      case 'author':
        return book.authors.includes(name);
      case 'topic':
        return book.topics.includes(name) ||
          (book.analysis?.ai_topics || []).includes(name);
      case 'theme':
        return book.themes.includes(name) ||
          (book.analysis?.ai_themes || []).includes(name);
      case 'tag':
        return book.tags.includes(name) ||
          (book.analysis?.ai_tags || []).includes(name);
      default:
        return false;
    }
  });
}
