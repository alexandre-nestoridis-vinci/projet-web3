/**
 * Type definitions for News application
 */

export interface Article {
  id?: string;
  title: string;
  description: string;
  content: string;
  url: string;
  source: {
    name: string;
    url: string;
  };
  publishedAt: Date;
  category: string;
  dedupHash: string;
  summary?: string;
  sentiment?: "positive" | "negative" | "neutral";
  keywords?: string[];
  fetchedAt?: Date;
}

export interface Comment {
  id?: string;
  text: string;
  authorName?: string;
  createdAt: Date;
}

export interface AnalysisResult {
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  keywords: string[];
}

/** Structure de news brute depuis l'IA */
export interface RawNewsItem {
  title: string;
  description: string;
  content: string;
  url: string;
  source: string;
}

/** Résultat de récupération de news */
export interface FetchNewsResult {
  success: boolean;
  articles: Article[];
  message: string;
}
