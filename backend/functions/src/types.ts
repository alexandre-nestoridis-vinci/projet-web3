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

// Interface Comment supprimée

export interface AnalysisResult {
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  keywords: string[];
}
