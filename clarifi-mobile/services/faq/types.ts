export interface FAQ {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
  tags: string[];
  relatedQuestions: string[];
  lastUpdated: string;
}

export interface FAQCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  order: number;
  questionCount: number;
  faqs: FAQ[];
}

export interface SearchResult {
  faq: FAQ;
  category: FAQCategory;
  relevanceScore: number;
  matchType: 'exact' | 'keyword' | 'fuzzy' | 'category';
  matchedTerms: string[];
}

export interface SearchMetrics {
  query: string;
  resultCount: number;
  searchTime: number;
  timestamp: Date;
  selectedResultId?: string;
}

export interface FAQSearchAnalytics {
  totalSearches: number;
  averageResultCount: number;
  averageSearchTime: number;
  topQueries: Array<{ query: string; count: number }>;
  successRate: number;
}
