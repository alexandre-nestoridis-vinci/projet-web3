export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: NewsCategory;
  source: string;
  url: string;
  publishedAt: Date;
  aiGenerated: boolean;
  imageUrl?: string;
  tags: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface NewsCategory {
  id: string;
  name: string;
  displayName: string;
  color: string;
  icon: string;
}

export interface NewsRequest {
  category: string;
  keywords?: string[];
  limit?: number;
  language?: string;
}

export interface AINewsAnalysis {
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  relatedTopics: string[];
}