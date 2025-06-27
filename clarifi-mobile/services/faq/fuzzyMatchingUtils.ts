/**
 * Advanced Fuzzy Matching Utilities for FAQ Search
 * Optimized for Canadian financial terminology and maximum hit rate
 */

export interface FuzzyMatchResult {
  score: number;
  confidence: number;
  matchType: 'exact' | 'partial' | 'fuzzy' | 'semantic' | 'ngram';
  matchedSegments: string[];
}

export interface FinancialTermMap {
  [key: string]: string[];
}

/**
 * Canadian financial terminology synonyms and variations
 */
const CANADIAN_FINANCIAL_TERMS: FinancialTermMap = {
  'credit score': [
    'credit rating',
    'credit report',
    'creditworthiness',
    'fico score',
    'beacon score',
  ],
  'credit utilization': [
    'credit usage',
    'credit ratio',
    'balance ratio',
    'utilization rate',
  ],
  'emergency fund': [
    'emergency savings',
    'rainy day fund',
    'emergency money',
    'safety net',
  ],
  tfsa: ['tax free savings account', 'tax-free savings', 'tfsa account'],
  rrsp: ['retirement savings plan', 'registered retirement', 'rrsp account'],
  budget: ['budgeting', 'financial plan', 'spending plan', 'money management'],
  'bank account': ['banking account', 'chequing account', 'savings account'],
  interac: ['e-transfer', 'etransfer', 'electronic transfer', 'money transfer'],
  mortgage: ['home loan', 'house loan', 'property loan'],
  'interest rate': ['interest', 'rate', 'apr', 'annual percentage rate'],
  debt: ['loan', 'credit card debt', 'owing money', 'balance'],
  payment: ['pay', 'paying', 'bill payment', 'monthly payment'],
  clarifi: ['app', 'application', 'platform', 'tool', 'service'],
  statement: ['bank statement', 'credit card statement', 'financial statement'],
  transaction: ['purchase', 'spending', 'expense', 'charge'],
  income: ['salary', 'wage', 'earnings', 'money coming in'],
  expense: ['spending', 'cost', 'expenditure', 'money going out'],
  savings: ['save', 'saving money', 'putting aside money'],
  investment: ['investing', 'invest', 'portfolio', 'stocks', 'bonds'],
  insurance: ['coverage', 'protection', 'policy'],
  fees: ['charges', 'costs', 'service fees', 'banking fees'],
  limit: ['maximum', 'cap', 'ceiling', 'restriction'],
  minimum: ['min', 'lowest', 'floor', 'least amount'],
  improve: ['increase', 'boost', 'enhance', 'better', 'raise'],
  reduce: ['lower', 'decrease', 'cut', 'minimize', 'less'],
  check: ['view', 'see', 'look at', 'monitor', 'track'],
  avoid: ['prevent', 'stop', 'eliminate', 'skip'],
  choose: ['select', 'pick', 'decide on', 'opt for'],
  best: ['good', 'top', 'recommended', 'optimal', 'ideal'],
  canada: ['canadian', 'in canada', 'cad', 'domestic'],
  free: ['no cost', 'no fee', 'complimentary', 'without charge'],
};

/**
 * Common financial question patterns
 */
const QUESTION_PATTERNS = [
  'how to',
  'how do i',
  'how can i',
  'what is',
  'what are',
  'why should',
  'when should',
  'where can',
  'which is',
  'should i',
  'can i',
  'is it',
  'best way to',
  'how much',
  'what happens if',
];

export class FuzzyMatchingUtils {
  /**
   * Calculate Levenshtein distance between two strings
   */
  static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate fuzzy similarity score (0-1) based on Levenshtein distance
   */
  static fuzzyScore(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(
      str1.toLowerCase(),
      str2.toLowerCase()
    );
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  /**
   * Generate N-grams from a string
   */
  static generateNGrams(text: string, n: number = 3): string[] {
    const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const words = normalized.split(/\s+/).filter(word => word.length > 0);
    const ngrams: string[] = [];

    // Character n-grams for fuzzy matching
    for (const word of words) {
      if (word.length >= n) {
        for (let i = 0; i <= word.length - n; i++) {
          ngrams.push(word.substring(i, i + n));
        }
      }
    }

    // Word n-grams for phrase matching
    if (words.length >= n) {
      for (let i = 0; i <= words.length - n; i++) {
        ngrams.push(words.slice(i, i + n).join(' '));
      }
    }

    return [...new Set(ngrams)]; // Remove duplicates
  }

  /**
   * Calculate N-gram similarity between two texts
   */
  static ngramSimilarity(text1: string, text2: string, n: number = 3): number {
    const ngrams1 = new Set(this.generateNGrams(text1, n));
    const ngrams2 = new Set(this.generateNGrams(text2, n));

    const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
    const union = new Set([...ngrams1, ...ngrams2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Expand query with Canadian financial term synonyms
   */
  static expandQueryWithSynonyms(query: string): string[] {
    const expandedTerms = [query];
    const normalizedQuery = query.toLowerCase();

    for (const [term, synonyms] of Object.entries(CANADIAN_FINANCIAL_TERMS)) {
      if (normalizedQuery.includes(term)) {
        synonyms.forEach(synonym => {
          const expandedQuery = normalizedQuery.replace(term, synonym);
          expandedTerms.push(expandedQuery);
        });
      }

      // Check if query contains any synonyms
      synonyms.forEach(synonym => {
        if (
          normalizedQuery.includes(synonym) &&
          !expandedTerms.includes(term)
        ) {
          const expandedQuery = normalizedQuery.replace(synonym, term);
          expandedTerms.push(expandedQuery);
        }
      });
    }

    return [...new Set(expandedTerms)];
  }

  /**
   * Extract and normalize financial terms from text
   */
  static extractFinancialTerms(text: string): string[] {
    const normalized = text.toLowerCase();
    const extractedTerms: string[] = [];

    // Extract known financial terms
    for (const term of Object.keys(CANADIAN_FINANCIAL_TERMS)) {
      if (normalized.includes(term)) {
        extractedTerms.push(term);
      }
    }

    // Extract synonym matches
    for (const [mainTerm, synonyms] of Object.entries(
      CANADIAN_FINANCIAL_TERMS
    )) {
      for (const synonym of synonyms) {
        if (normalized.includes(synonym)) {
          extractedTerms.push(mainTerm);
        }
      }
    }

    return [...new Set(extractedTerms)];
  }

  /**
   * Normalize query by removing question patterns and stop words
   */
  static normalizeQuery(query: string): string {
    let normalized = query.toLowerCase().trim();

    // Remove common question patterns
    for (const pattern of QUESTION_PATTERNS) {
      if (normalized.startsWith(pattern)) {
        normalized = normalized.substring(pattern.length).trim();
        break;
      }
    }

    // Remove common stop words specific to financial queries
    const stopWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
    ];
    const words = normalized.split(/\s+/);
    const filteredWords = words.filter(
      word => word.length > 2 && !stopWords.includes(word)
    );

    return filteredWords.join(' ');
  }

  /**
   * Calculate comprehensive fuzzy match score
   */
  static comprehensiveFuzzyMatch(
    query: string,
    target: string
  ): FuzzyMatchResult {
    const normalizedQuery = this.normalizeQuery(query);
    const normalizedTarget = target.toLowerCase();

    // 1. Exact match check
    if (normalizedTarget.includes(normalizedQuery)) {
      return {
        score: 1.0,
        confidence: 0.95,
        matchType: 'exact',
        matchedSegments: [normalizedQuery],
      };
    }

    // 2. Partial word matching
    const queryWords = normalizedQuery.split(/\s+/);
    const targetWords = normalizedTarget.split(/\s+/);
    let partialMatches = 0;
    const matchedSegments: string[] = [];

    for (const queryWord of queryWords) {
      for (const targetWord of targetWords) {
        if (targetWord.includes(queryWord) || queryWord.includes(targetWord)) {
          partialMatches++;
          matchedSegments.push(queryWord);
          break;
        }
      }
    }

    const partialScore = partialMatches / queryWords.length;
    if (partialScore > 0.6) {
      return {
        score: partialScore * 0.8,
        confidence: 0.8,
        matchType: 'partial',
        matchedSegments,
      };
    }

    // 3. Fuzzy string matching
    const fuzzyScore = this.fuzzyScore(normalizedQuery, normalizedTarget);
    if (fuzzyScore > 0.7) {
      return {
        score: fuzzyScore * 0.6,
        confidence: 0.7,
        matchType: 'fuzzy',
        matchedSegments: [normalizedQuery],
      };
    }

    // 4. N-gram similarity
    const ngramScore = this.ngramSimilarity(
      normalizedQuery,
      normalizedTarget,
      3
    );
    if (ngramScore > 0.4) {
      return {
        score: ngramScore * 0.5,
        confidence: 0.6,
        matchType: 'ngram',
        matchedSegments: [],
      };
    }

    // 5. Semantic term matching
    const queryTerms = this.extractFinancialTerms(normalizedQuery);
    const targetTerms = this.extractFinancialTerms(normalizedTarget);
    const commonTerms = queryTerms.filter(term => targetTerms.includes(term));

    if (commonTerms.length > 0) {
      const semanticScore = commonTerms.length / Math.max(queryTerms.length, 1);
      return {
        score: semanticScore * 0.4,
        confidence: 0.5,
        matchType: 'semantic',
        matchedSegments: commonTerms,
      };
    }

    return {
      score: 0,
      confidence: 0,
      matchType: 'exact',
      matchedSegments: [],
    };
  }

  /**
   * Score boost for Canadian-specific content
   */
  static getCanadianBoost(text: string): number {
    const canadianIndicators = [
      'canada',
      'canadian',
      'cad',
      'tfsa',
      'rrsp',
      'cpp',
      'ei',
      'gst',
      'hst',
      'equifax',
      'transunion',
      'rbc',
      'td',
      'scotiabank',
      'bmo',
      'cibc',
      'tangerine',
      'simplii',
      'desjardins',
      'vancity',
      'interac',
    ];

    const lowerText = text.toLowerCase();
    const matches = canadianIndicators.filter(indicator =>
      lowerText.includes(indicator)
    );

    return Math.min(matches.length * 0.1, 0.3); // Max 30% boost for Canadian content
  }

  /**
   * Calculate relevance for ClariFi feature matching
   */
  static getClariFiRelevanceBoost(query: string, faqText: string): number {
    const clarifiFeatures = [
      'upload',
      'statement',
      'ai',
      'categorization',
      'privacy',
      'security',
      'notification',
      'alert',
      'dashboard',
      'insight',
      'analysis',
      'automatic',
    ];

    const queryLower = query.toLowerCase();
    const faqLower = faqText.toLowerCase();

    let relevanceBoost = 0;

    for (const feature of clarifiFeatures) {
      if (queryLower.includes(feature) && faqLower.includes(feature)) {
        relevanceBoost += 0.15;
      }
    }

    // Extra boost if explicitly asking about ClariFi
    if (queryLower.includes('clarifi') && faqLower.includes('clarifi')) {
      relevanceBoost += 0.25;
    }

    return Math.min(relevanceBoost, 0.5); // Max 50% boost
  }
}
