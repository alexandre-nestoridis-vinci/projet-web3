/**
 * Configuration et constantes pour l'application News IA
 * Centralisation des configurations pour maintenir les bonnes pratiques
 */

// =====================================================
// CONFIGURATION ENVIRONNEMENT
// =====================================================

export const ENVIRONMENT = {
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  IS_TEST: process.env.NODE_ENV === "test",
};

// =====================================================
// CONFIGURATION FIREBASE
// =====================================================

export const FIREBASE_CONFIG = {
  COLLECTIONS: {
    ARTICLES: "articles",
    AI_ANALYSES: "ai_analyses",
    CATEGORIES: "categories",
    SEARCH_LOGS: "search_logs",
    USER_SESSIONS: "user_sessions",
  },
  INDEXES: {
    ARTICLES_BY_CATEGORY: "articles_category_publishedAt",
    ARTICLES_BY_DATE: "articles_publishedAt_status",
    ARTICLES_SEARCH: "articles_search_composite",
  },
};

// =====================================================
// Configuration des limites de sécurité pour éviter les abus
// et surcharges système
// =====================================================

export const LIMITS = {
  // Pagination
  MAX_ARTICLES_PER_PAGE: 100,
  DEFAULT_ARTICLES_PER_PAGE: 12,
  MIN_ARTICLES_PER_PAGE: 1,

  // Recherche
  MAX_SEARCH_QUERY_LENGTH: 200,
  MIN_SEARCH_QUERY_LENGTH: 2,
  MAX_SEARCH_SUGGESTIONS: 10,

  // Contenu
  MAX_ARTICLE_TITLE_LENGTH: 200,
  MAX_ARTICLE_SUMMARY_LENGTH: 500,
  MAX_ARTICLE_CONTENT_LENGTH: 50000,
  MIN_ARTICLE_CONTENT_LENGTH: 100,

  // IA
  AI_PROCESSING_TIMEOUT: 30000, // 30 secondes
  MAX_AI_RETRIES: 3,
  AI_BATCH_SIZE: 10,
};

// =====================================================
// CONFIGURATION CATÉGORIES
// =====================================================

export const CATEGORIES = {
  TECHNOLOGY: {
    id: "technologie",
    name: "technologie",
    displayName: "Technologie",
    color: "#3b82f6",
    icon: "laptop",
    description: "Actualités technologiques et innovations",
    keywords: ["tech", "technologie", "innovation", "startup", "ai", "ia"],
  },
  SPORTS: {
    id: "sport",
    name: "sport",
    displayName: "Sport",
    color: "#10b981",
    icon: "trophy",
    description: "Actualités sportives",
    keywords: ["sport", "football", "tennis", "basket", "championnat"],
  },
  POLITICS: {
    id: "politique",
    name: "politique",
    displayName: "Politique",
    color: "#f59e0b",
    icon: "users",
    description: "Actualités politiques",
    keywords: [
      "politique", "élection", "gouvernement",
      "président", "ministre",
    ],
  },
  ECONOMY: {
    id: "economie",
    name: "economie",
    displayName: "Économie",
    color: "#8b5cf6",
    icon: "chart-bar",
    description: "Actualités économiques et financières",
    keywords: ["économie", "finance", "bourse", "entreprise", "marché"],
  },
  HEALTH: {
    id: "sante",
    name: "sante",
    displayName: "Santé",
    color: "#ef4444",
    icon: "heart",
    description: "Actualités santé et médecine",
    keywords: ["santé", "médecine", "hôpital", "vaccin", "traitement"],
  },
  ENVIRONMENT: {
    id: "environnement",
    name: "environnement",
    displayName: "Environnement",
    color: "#06b6d4",
    icon: "globe",
    description: "Actualités environnementales et climat",
    keywords: ["environnement", "climat", "écologie", "pollution", "énergie"],
  },
  CULTURE: {
    id: "culture",
    name: "culture",
    displayName: "Culture",
    color: "#f97316",
    icon: "book",
    description: "Actualités culturelles et divertissement",
    keywords: ["culture", "cinéma", "musique", "livre", "art", "théâtre"],
  },
} as const;

// =====================================================
// CONFIGURATION IA
// =====================================================

export const AI_CONFIG = {
  ENABLED: true,
  PROVIDER: "mock", // 'openai' | 'mock' | 'custom'
  TIMEOUT: 30000,
  RETRY_COUNT: 3,
  BATCH_SIZE: 5,

  // Seuils de confiance
  MIN_CONFIDENCE_THRESHOLD: 0.5,
  HIGH_CONFIDENCE_THRESHOLD: 0.8,

  // Analyse de sentiment
  SENTIMENT: {
    POSITIVE_THRESHOLD: 0.6,
    NEGATIVE_THRESHOLD: 0.4,
    NEUTRAL_RANGE: [0.4, 0.6],
  },

  // Extraction de mots-clés
  KEYWORDS: {
    MIN_LENGTH: 3,
    MAX_COUNT: 10,
    MIN_FREQUENCY: 2,
  },
};

// =====================================================
// MESSAGES D'ERREUR
// =====================================================

export const ERROR_MESSAGES = {
  // Validation
  INVALID_ARTICLE_ID: "ID d'article invalide",
  INVALID_CATEGORY: "Catégorie invalide",
  INVALID_SEARCH_QUERY: "Requête de recherche invalide",

  // Limites
  SEARCH_QUERY_TOO_SHORT:
    "La recherche doit contenir au moins " +
    `${LIMITS.MIN_SEARCH_QUERY_LENGTH} caractères`,
  SEARCH_QUERY_TOO_LONG:
    "La recherche ne peut pas dépasser " +
    `${LIMITS.MAX_SEARCH_QUERY_LENGTH} caractères`,
  TOO_MANY_RESULTS:
    `Trop de résultats demandés (maximum ${LIMITS.MAX_ARTICLES_PER_PAGE})`,

  // Base de données
  DATABASE_ERROR: "Erreur de base de données",
  ARTICLE_NOT_FOUND: "Article non trouvé",
  CATEGORY_NOT_FOUND: "Catégorie non trouvée",

  // IA
  AI_ANALYSIS_FAILED: "Échec de l'analyse IA",
  AI_TIMEOUT: "Délai d'analyse IA dépassé",
  AI_SERVICE_UNAVAILABLE: "Service IA indisponible",

  // Général
  INTERNAL_ERROR: "Erreur interne du serveur",
  UNAUTHORIZED: "Accès non autorisé",
  FORBIDDEN: "Action interdite",
};

// =====================================================
// CODES DE STATUT HTTP
// =====================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

// =====================================================
// REGEX PATTERNS
// =====================================================

export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  ARTICLE_ID: /^[a-zA-Z0-9_-]+$/,
  SEARCH_QUERY: /^[\w\s\-àâäçéèêëïîôöùûüÿñ]{2,200}$/i,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
};

// =====================================================
// UTILITAIRES
// =====================================================

export const UTILS = {
  // Génération d'IDs
  generateId: (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Validation
  isValidEmail: (email: string): boolean => {
    return PATTERNS.EMAIL.test(email);
  },

  isValidUrl: (url: string): boolean => {
    return PATTERNS.URL.test(url);
  },

  isValidSearchQuery: (query: string): boolean => {
    return PATTERNS.SEARCH_QUERY.test(query) &&
           query.length >= LIMITS.MIN_SEARCH_QUERY_LENGTH &&
           query.length <= LIMITS.MAX_SEARCH_QUERY_LENGTH;
  },

  // Formatage
  slugify: (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  },

  // Sanitisation
  sanitizeHtml: (html: string): string => {
    // Implémentation basique - utiliser une vraie lib en production
    return html.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
  },
};

// =====================================================
// LOGS ET MONITORING
// =====================================================

export const LOG_CONFIG = {
  LEVELS: {
    ERROR: "error",
    WARN: "warn",
    INFO: "info",
    DEBUG: "debug",
  },

  // Contextes de logs
  CONTEXTS: {
    API: "api",
    DATABASE: "database",
    AI_SERVICE: "ai_service",
    VALIDATION: "validation",
    AUTH: "auth",
  },
};

// =====================================================
// CACHE ET PERFORMANCE
// =====================================================

export const CACHE_CONFIG = {
  TTL: {
    ARTICLES: 5 * 60 * 1000, // 5 minutes
    CATEGORIES: 30 * 60 * 1000, // 30 minutes
    SEARCH_SUGGESTIONS: 15 * 60 * 1000, // 15 minutes
    AI_ANALYSIS: 60 * 60 * 1000, // 1 heure
  },

  KEYS: {
    ARTICLES_BY_CATEGORY: (category: string) => `articles:category:${category}`,
    SEARCH_SUGGESTIONS: (query: string) => `search:suggestions:${query}`,
    AI_ANALYSIS: (articleId: string) => `ai:analysis:${articleId}`,
  },
};
