export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: NewsCategory;
  source: string;
  author?: string;
  url: string;
  imageUrl?: string;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  aiGenerated: boolean;
  tags: string[];
  keywords: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
  aiAnalysis?: AIAnalysis;
  views: number;
  popularity: number;
  status: 'draft' | 'published' | 'archived';
}

export interface NewsCategory {
  id: string;
  name: string;
  displayName: string;
  color: string;
  icon: string;
  description?: string;
  articleCount?: number;
}

export interface AIAnalysis {
  id: string;
  articleId: string;
  summary: string;
  keyPoints: string[];
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  confidence: number;
  relatedTopics: string[];
  processedAt: Date;
  processingTime: number;
  success: boolean;
  errorMessage?: string;
}

export interface NewsRequest {
  category?: string;
  keywords?: string[];
  limit?: number;
  offset?: number;
  language?: string;
  sortBy?: 'publishedAt' | 'popularity' | 'views' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  dateFrom?: Date;
  dateTo?: Date;
  source?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface SearchSuggestion {
  text: string;
  type: 'keyword' | 'category' | 'source' | 'author';
  count: number;
}

export interface ArticleStats {
  totalViews: number;
  dailyViews: number;
  weeklyViews: number;
  monthlyViews: number;
  averageReadTime: number;
  shareCount: number;
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  articleCount: number;
  totalViews: number;
  averagePopularity: number;
  lastUpdated: Date;
}

export interface AIProcessingStats {
  totalProcessed: number;
  successfullyProcessed: number;
  failedProcessing: number;
  averageProcessingTime: number;
  successRate: number;
  dailyProcessing: number;
}

export interface AIStats {
  totalAnalyses: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  averageProcessingTime: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  popularKeywords: string[];
  dailyAnalyses: number;
  successRate: number;
}