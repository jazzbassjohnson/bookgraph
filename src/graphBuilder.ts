import type {
  Book, BookSuggestion,
  GraphData, GraphNode, GraphLink, EdgeToggles, AttributeType,
} from './types';

const COLORS: Record<string, string> = {
  book: '#6366f1',
  author: '#f59e0b',
  topic: '#10b981',
  theme: '#ec4899',
  tag: '#8b5cf6',
  suggestion: '#6366f1',
};

export function buildGraphData(
  books: Book[],
  edgeToggles: EdgeToggles,
  threshold: number,
  suggestions: BookSuggestion[] = [],
  showSuggestions = false
): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const attributeBookCounts: Map<string, number> = new Map();

  // First pass: count how many books each attribute is connected to
  for (const book of books) {
    if (edgeToggles.author) {
      for (const author of book.authors) {
        const id = `author:${author}`;
        attributeBookCounts.set(id, (attributeBookCounts.get(id) || 0) + 1);
      }
    }
    if (edgeToggles.topic) {
      for (const topic of book.topics) {
        const id = `topic:${topic}`;
        attributeBookCounts.set(id, (attributeBookCounts.get(id) || 0) + 1);
      }
    }
    if (edgeToggles.theme) {
      for (const theme of book.themes) {
        const id = `theme:${theme}`;
        attributeBookCounts.set(id, (attributeBookCounts.get(id) || 0) + 1);
      }
    }
    if (edgeToggles.tag) {
      for (const tag of book.tags) {
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

  function addAttributeNode(id: string, name: string, type: AttributeType) {
    if (!attributeNodesSet.has(id) && validAttributes.has(id)) {
      attributeNodesSet.add(id);
      nodes.push({
        id,
        name,
        type,
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

    if (edgeToggles.author) {
      for (const author of book.authors) {
        const attrId = `author:${author}`;
        if (validAttributes.has(attrId)) {
          addAttributeNode(attrId, author, 'author');
          links.push({ source: bookNodeId, target: attrId, type: 'author' });
        }
      }
    }

    if (edgeToggles.topic) {
      for (const topic of book.topics) {
        const attrId = `topic:${topic}`;
        if (validAttributes.has(attrId)) {
          addAttributeNode(attrId, topic, 'topic');
          links.push({ source: bookNodeId, target: attrId, type: 'topic' });
        }
      }
    }

    if (edgeToggles.theme) {
      for (const theme of book.themes) {
        const attrId = `theme:${theme}`;
        if (validAttributes.has(attrId)) {
          addAttributeNode(attrId, theme, 'theme');
          links.push({ source: bookNodeId, target: attrId, type: 'theme' });
        }
      }
    }

    if (edgeToggles.tag) {
      for (const tag of book.tags) {
        const attrId = `tag:${tag}`;
        if (validAttributes.has(attrId)) {
          addAttributeNode(attrId, tag, 'tag');
          links.push({ source: bookNodeId, target: attrId, type: 'tag' });
        }
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
            type: 'topic',
          });
        }
      }
    }
  }

  return { nodes, links };
}

export function findRelatedBooks(book: Book, allBooks: Book[]): Book[] {
  const related = new Set<string>();

  for (const other of allBooks) {
    if (other.id === book.id) continue;

    if (book.authors.some((a) => other.authors.includes(a))) {
      related.add(other.id);
      continue;
    }

    if (book.topics.some((t) => other.topics.includes(t))) {
      related.add(other.id);
      continue;
    }

    if (book.themes.some((t) => other.themes.includes(t))) {
      related.add(other.id);
      continue;
    }

    if (book.tags.some((t) => other.tags.includes(t))) {
      related.add(other.id);
    }
  }

  return allBooks.filter((b) => related.has(b.id));
}

export function getConnectedBooks(attributeId: string, books: Book[]): Book[] {
  const [type, ...nameParts] = attributeId.split(':');
  const name = nameParts.join(':');

  return books.filter((book) => {
    switch (type) {
      case 'author':
        return book.authors.includes(name);
      case 'topic':
        return book.topics.includes(name);
      case 'theme':
        return book.themes.includes(name);
      case 'tag':
        return book.tags.includes(name);
      default:
        return false;
    }
  });
}
