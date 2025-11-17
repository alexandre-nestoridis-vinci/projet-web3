/**
 * Types et interfaces pour l'application News IA
 * Centralisation de tous les types utilisés dans le backend
 */

// =====================================================
// INTERFACES PRINCIPALES
// =====================================================

/**
 * Catégorie d'actualité
 */
export interface NewsCategory {
  id: string;
  name: string;
  displayName: string;
  color: string;
  icon: string;
  description?: string;
}

/**
 * Article de presse complet
 */
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: NewsCategory | string;
  source: string;
  author?: string;
  url: string;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  status: "draft" | "published" | "archived";
  aiGenerated: boolean;
  imageUrl?: string;
  tags: string[];
  keywords: string[];
  sentiment?: "positive" | "negative" | "neutral";
  views: number;
  popularity: number;
}

/**
 * Analyse IA d'un article
 */
export interface AIAnalysis {
  id: string;
  articleId: string;
  summary: string;
  keyPoints: string[];
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number;
  keywords: string[];
  relatedTopics: string[];
  confidence: number;
  processingTime: number;
  createdAt: Date;
  updatedAt: Date;
  processedAt: Date;
  success: boolean;
}

/**
 * Requête pour récupérer des articles avec filtres
 */
export interface NewsRequest {
  category?: string;
  source?: string;
  status?: "draft" | "published" | "archived";
  limit?: number;
  offset?: number;
  sortBy?: "publishedAt" | "popularity" | "views";
  sortOrder?: "asc" | "desc";
  dateFrom?: Date;
  dateTo?: Date;
  dependencies?: Record<string, unknown>;
  tags?: string[];
}

/**
 * Réponse API standardisée
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

// =====================================================
// STATISTIQUES
// =====================================================

/**
 * Statistiques par catégorie
 */
export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  articleCount: number;
  totalViews: number;
  averagePopularity: number;
  lastUpdated: Date;
}

/**
 * Statistiques des analyses IA
 */
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

/**
 * Statistiques d'un article
 */
export interface ArticleStats {
  totalViews: number;
  dailyViews: number;
  weeklyViews: number;
  monthlyViews: number;
  averageReadTime: number;
  shareCount: number;
}

// =====================================================
// TYPES UTILITAIRES
// =====================================================

/**
 * Suggestions de recherche
 */
export interface SearchSuggestion {
  query: string;
  count: number;
  category?: string;
}

/**
 * Paramètres de filtrage
 */
export interface FilterParams {
  category?: string;
  source?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  sentiment?: "positive" | "negative" | "neutral";
  tags?: string[];
  minViews?: number;
  maxViews?: number;
}

/**
 * Options de tri
 */
export interface SortOptions {
  field: "publishedAt" | "popularity" | "views" | "title" | "createdAt";
  order: "asc" | "desc";
}

/**
 * Pagination
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

/**
 * Résultat paginé
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// =====================================================
// VALIDATION ET ERREURS
// =====================================================

/**
 * Erreur de validation
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: unknown;
}

/**
 * Erreur API personnalisée
 */
export interface APIError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
  path?: string;
}

/**
 * Options de validation pour les articles
 */
export interface ArticleValidationOptions {
  requireImage?: boolean;
  minContentLength?: number;
  maxContentLength?: number;
  allowedSources?: string[];
  requiredFields?: (keyof NewsArticle)[];
}

// =====================================================
// CONFIGURATION
// =====================================================

/**
 * Configuration de l'analyse IA
 */
export interface AIConfig {
  enabled: boolean;
  provider: "openai" | "mock" | "custom";
  timeout: number;
  retryCount: number;
  batchSize: number;
  languages: string[];
}

/**
 * Configuration des catégories
 */
export interface CategoryConfig {
  id: string;
  name: string;
  displayName: string;
  color: string;
  icon: string;
  description: string;
  keywords: string[];
  priority: number;
  enabled: boolean;
}

// =====================================================
// TYPES D'ÉNUMÉRATION
// =====================================================

/**
 * Statuts possibles d'un article
 */
export enum ArticleStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived"
}

/**
 * Types de sentiment
 */
export enum SentimentType {
  POSITIVE = "positive",
  NEGATIVE = "negative",
  NEUTRAL = "neutral"
}

/**
 * Sources d'articles supportées
 */
export enum ArticleSource {
  RSS = "rss",
  API = "api",
  MANUAL = "manual",
  SCRAPER = "scraper"
}

/**
 * Niveaux de log
 */
export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug"
}

// =====================================================
// TYPES DE FONCTIONS
// =====================================================

/**
 * Type pour les fonctions de transformation d'article
 */
export type ArticleTransformer = (article: NewsArticle) => NewsArticle;

/**
 * Type pour les fonctions de validation
 */
export type Validator<T> = (data: T) => ValidationError[];

/**
 * Type pour les handlers d'événements
 */
export type EventHandler<T = unknown> = (event: T) => void | Promise<void>;

// =====================================================
// UTILITAIRES DE TYPE
// =====================================================

/**
 * Type helper pour extraire les clés d'un objet
 */
export type KeysOf<T> = keyof T;

/**
 * Type helper pour rendre certaines propriétés optionnelles
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Type helper pour les réponses API avec données
 */
export type DataResponse<T> = APIResponse<T> & { data: T };

/**
 * Type helper pour les réponses API avec erreur
 */
export type ErrorResponse = APIResponse & { success: false; error: string };

// =====================================================
// TYPES DE VALIDATION
// =====================================================

/**
 * Custom validation error class for detailed validation failures
 */
export class CustomValidationError extends Error {
  public readonly code: string;
  public readonly field?: string;
  public readonly value?: unknown;

  /**
   * @param {string} message Error message
   * @param {string} code Error code
   * @param {string} field Field name
   * @param {unknown} value Field value
   */
  constructor(
    message: string,
    code = "VALIDATION_ERROR",
    field?: string,
    value?: unknown
  ) {
    super(message);
    this.name = "ValidationError";
    this.code = code;
    this.field = field;
    this.value = value;
  }
}

/**
 * Application error class for handling operational errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly context?: unknown;

  /**
   * @param {string} message Error message
   * @param {number} statusCode HTTP status code
   * @param {string} code Error code
   * @param {boolean} isOperational Is operational error
   * @param {unknown} context Additional context
   */
  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    isOperational = true,
    context?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

// =============================================================================
// VALIDATION & SANITIZATION TYPES
// =============================================================================

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: "string" | "number" | "boolean" | "array" | "object";
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: unknown[];
  custom?: (value: unknown) => boolean | string;
}

// Note: ValidationError interface already exported above

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedData?: unknown;
}

// =============================================================================
// RATE LIMITING TYPES
// =============================================================================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

export interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// =============================================================================
// PERFORMANCE & MONITORING TYPES
// =============================================================================

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  timestamp: Date;
  operation: string;
  success: boolean;
  errorCode?: string;
}

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize?: number;
  strategy?: "LRU" | "FIFO" | "TTL";
}

export interface CacheEntry<T = unknown> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}
