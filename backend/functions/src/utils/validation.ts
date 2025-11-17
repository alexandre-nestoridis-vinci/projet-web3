import {PATTERNS, LIMITS, ERROR_MESSAGES} from "../config/constants";
import {ValidationResult, ValidationError} from "../types/types";

/**
 * Utilitaires de validation pour l'application News IA
 * Applique les bonnes pratiques de validation et gestion d'erreurs
 */

// =====================================================
// CLASSE DE VALIDATION
// =====================================================

/**
 * Classe utilitaire pour la validation des données
 */
export class Validator {
  /**
   * Valide un ID d'article
   * @param {string} id L'identifiant de l'article à valider
   * @return {ValidationResult} Résultat de la validation
   */
  static validateArticleId(id: string): ValidationResult {
    if (!id || typeof id !== "string") {
      return {
        isValid: false,
        errors: [{field: "id", message: ERROR_MESSAGES.INVALID_ARTICLE_ID}],
      };
    }

    if (!PATTERNS.ARTICLE_ID.test(id)) {
      return {
        isValid: false,
        errors: [{field: "id", message: ERROR_MESSAGES.INVALID_ARTICLE_ID}],
      };
    }

    return {isValid: true, errors: []};
  }

  /**
   * Valide une requête de recherche
   * @param {string} query La requête de recherche à valider
   * @return {ValidationResult} Résultat de la validation
   */
  static validateSearchQuery(query: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!query || typeof query !== "string") {
      errors.push({field: "query",
        message: ERROR_MESSAGES.INVALID_SEARCH_QUERY});
    } else {
      if (query.length < LIMITS.MIN_SEARCH_QUERY_LENGTH) {
        errors.push({
          field: "query",
          message:
        ERROR_MESSAGES.SEARCH_QUERY_TOO_SHORT,
        });
      }

      if (query.length > LIMITS.MAX_SEARCH_QUERY_LENGTH) {
        errors.push({
          field: "query",
          message: ERROR_MESSAGES.SEARCH_QUERY_TOO_LONG,
        });
      }

      if (!PATTERNS.SEARCH_QUERY.test(query)) {
        errors.push({
          field: "query",
          message: ERROR_MESSAGES.INVALID_SEARCH_QUERY,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valide une catégorie
   * @param {string} category La catégorie à valider
   * @return {ValidationResult} Résultat de la validation
   */
  static validateCategory(category: string): ValidationResult {
    if (!category || typeof category !== "string") {
      return {
        isValid: false,
        errors: [{field: "category", message: ERROR_MESSAGES.INVALID_CATEGORY}],
      };
    }

    // Vérifier si la catégorie existe dans la configuration
    const validCategories = [
      "technologie", "sport", "politique", "economie",
      "sante", "environnement", "culture",
    ];

    if (!validCategories.includes(category.toLowerCase())) {
      return {
        isValid: false,
        errors: [{field: "category", message: ERROR_MESSAGES.INVALID_CATEGORY}],
      };
    }

    return {isValid: true, errors: []};
  }

  /**
   * Valide une URL
   * @param {string} url L'URL à valider
   * @return {ValidationResult} Résultat de la validation
   */
  static validateUrl(url: string): ValidationResult {
    if (!url || typeof url !== "string") {
      return {
        isValid: false,
        errors: [{field: "url", message: "URL invalide"}],
      };
    }

    if (!PATTERNS.URL.test(url)) {
      return {
        isValid: false,
        errors: [{field: "url", message: "Format d'URL invalide"}],
      };
    }

    return {isValid: true, errors: []};
  }

  /**
   * Valide une pagination
   * @param {number} page Numéro de page
   * @param {number} limit Limite par page
   * @return {ValidationResult} Résultat de la validation
   */
  static validatePagination(page?: number, limit?: number): ValidationResult {
    const errors: ValidationError[] = [];

    if (page !== undefined) {
      if (!Number.isInteger(page) || page < 1) {
        errors.push({
          field: "page",
          message: "Le numéro de page doit être un entier positif",
        });
      }
    }

    if (limit !== undefined) {
      if (
        !Number.isInteger(limit) ||
        limit < LIMITS.MIN_ARTICLES_PER_PAGE ||
        limit > LIMITS.MAX_ARTICLES_PER_PAGE
      ) {
        errors.push({
          field: "limit",
          message:
            `La limite doit être entre ${LIMITS.MIN_ARTICLES_PER_PAGE} ` +
            `et ${LIMITS.MAX_ARTICLES_PER_PAGE}`,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valide un article complet
   * @param {object} article L'article à valider
   * @return {ValidationResult} Résultat de la validation
   */
  static validateArticle(article: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];

    // Titre requis
    if (!article.title || typeof article.title !== "string") {
      errors.push({field: "title", message: "Le titre est requis"});
    } else if (
      typeof article.title === "string" &&
      article.title.length > LIMITS.MAX_ARTICLE_TITLE_LENGTH
    ) {
      errors.push({
        field: "title",
        message:
          "Le titre ne peut pas dépasser " +
          `${LIMITS.MAX_ARTICLE_TITLE_LENGTH} caractères`,
      });
    }

    // Contenu requis
    if (!article.content || typeof article.content !== "string") {
      errors.push({field: "content", message: "Le contenu est requis"});
    } else {
      if (
        typeof article.content === "string" &&
        article.content.length < LIMITS.MIN_ARTICLE_CONTENT_LENGTH
      ) {
        errors.push({
          field: "content",
          message:
            "Le contenu doit contenir au moins " +
            `${LIMITS.MIN_ARTICLE_CONTENT_LENGTH} caractères`,
        });
      }
      if (
        typeof article.content === "string" &&
        article.content.length > LIMITS.MAX_ARTICLE_CONTENT_LENGTH
      ) {
        errors.push({
          field: "content",
          message:
            "Le contenu ne peut pas dépasser " +
            `${LIMITS.MAX_ARTICLE_CONTENT_LENGTH} caractères`,
        });
      }
    }

    // URL requis
    if (article.url && typeof article.url === "string") {
      const urlValidation = this.validateUrl(article.url);
      if (!urlValidation.isValid) {
        errors.push(...urlValidation.errors);
      }
    }

    // Catégorie requise
    if (article.category && typeof article.category === "string") {
      const categoryValidation = this.validateCategory(article.category);
      if (!categoryValidation.isValid) {
        errors.push(...categoryValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// =====================================================
// CLASSE DE GESTION D'ERREURS
// =====================================================

/**
 * Classe d'erreur personnalisée pour l'application
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly context?: unknown;

  /**
   * @param {string} message Message d'erreur
   * @param {number} statusCode Code de statut HTTP
   * @param {string} code Code d'erreur
   * @param {unknown} context Contexte additionnel
   */
  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    context?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.context = context;

    // Maintient la stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Erreur de validation
   * @param {string} message Message d'erreur
   * @param {unknown} context Contexte additionnel
   * @return {AppError} Instance d'erreur de validation
   */
  static validation(message: string, context?: unknown): AppError {
    return new AppError(message, 400, "VALIDATION_ERROR", context);
  }

  /**
   * Erreur non trouvé
   * @param {string} message Message d'erreur
   * @param {unknown} context Contexte additionnel
   * @return {AppError} Instance d'erreur non trouvé
   */
  static notFound(message: string, context?: unknown): AppError {
    return new AppError(message, 404, "NOT_FOUND", context);
  }

  /**
   * Erreur de base de données
   * @param {string} message Message d'erreur
   * @param {unknown} context Contexte additionnel
   * @return {AppError} Instance d'erreur de base de données
   */
  static database(message: string, context?: unknown): AppError {
    return new AppError(message, 500, "DATABASE_ERROR", context);
  }

  /**
   * Erreur IA
   * @param {string} message Message d'erreur
   * @param {unknown} context Contexte additionnel
   * @return {AppError} Instance d'erreur IA
   */
  static aiService(message: string, context?: unknown): AppError {
    return new AppError(message, 503, "AI_SERVICE_ERROR", context);
  }

  /**
   * Erreur de timeout
   * @param {string} message - Le message d'erreur
   * @param {unknown} context - Le contexte optionnel
   * @return {AppError} L'erreur de timeout
   */
  static timeout(message: string, context?: unknown): AppError {
    return new AppError(message, 504, "TIMEOUT_ERROR", context);
  }

  /**
   * Convertit en format JSON pour les réponses API
   * @return {object} Représentation JSON de l'erreur
   */
  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        context: this.context,
      },
    };
  }
}

// =====================================================
// UTILITAIRES DE SANITISATION
// =====================================================

/**
 * Classe utilitaire pour la sanitisation des données
 */
export class Sanitizer {
  /**
   * Nettoie une chaîne de caractères
   * @param {string} input Chaîne à nettoyer
   * @return {string} Chaîne nettoyée
   */
  static cleanString(input: string): string {
    if (typeof input !== "string") return "";

    return input
      .trim()
      .replace(/\s+/g, " ") // Remplace espaces multiples par un seul
      .replace(/[<>]/g, ""); // Supprime les caractères HTML dangereux
  }

  /**
   * Nettoie une requête de recherche
   * @param {string} query Requête à nettoyer
   * @return {string} Requête nettoyée
   */
  static cleanSearchQuery(query: string): string {
    if (typeof query !== "string") return "";

    return query
      .trim()
      .toLowerCase()
      .replace(
        /[^\w\s\-àâäçéèêëïîôöùûüÿñ]/gi,
        ""
      ) // Garde seulement les caractères autorisés
      .replace(/\s+/g, " ") // Normalise les espaces
      .substring(0, LIMITS.MAX_SEARCH_QUERY_LENGTH);
  }

  /**
   * Nettoie un slug
   * @param {string} text Texte à convertir en slug
   * @return {string} Slug nettoyé
   */
  static cleanSlug(text: string): string {
    if (typeof text !== "string") return "";

    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
      .replace(/[^a-z0-9]+/g, "-") // Caractères spéciaux -> tirets
      .replace(/(^-|-$)/g, ""); // Supprime les tirets en début/fin
  }

  /**
   * Nettoie le contenu HTML
   * @param {string} html Contenu HTML à nettoyer
   * @return {string} HTML nettoyé
   */
  static cleanHtml(html: string): string {
    if (typeof html !== "string") return "";

    // Implémentation basique
    // Utiliser une vraie lib de sanitisation en production
    return html
      .replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        ""
      )
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
      .replace(/<embed\b[^<]*>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "");
  }
}

// =====================================================
// UTILITAIRES DE LOGGING
// =====================================================

/**
 * Classe utilitaire pour le logging
 */
export class Logger {
  /**
   * Log d'information
   * @param {string} message Message à logger
   * @param {unknown} context Contexte additionnel
   * @return {void}
   */
  static info(message: string, context?: unknown): void {
    console.log(
      `[INFO] ${new Date().toISOString()} - ${message}`,
      context || ""
    );
  }

  /**
   * Log d'erreur
   * @param {string} message Message d'erreur
   * @param {unknown} error Objet erreur
   * @param {unknown} context Contexte additionnel
   */
  static error(message: string, error?: unknown, context?: unknown): void {
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`,
      {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        context,
      }
    );
  }

  /**
   * Log de debug
   * @param {string} message Message de debug
   * @param {unknown} context Contexte additionnel
   */
  static debug(message: string, context?: unknown): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(
        `[DEBUG] ${new Date().toISOString()} - ${message}`,
        context || ""
      );
    }
  }

  /**
   * Log d'avertissement
   * @param {string} message Message d'avertissement
   * @param {unknown} context Contexte additionnel
   */
  static warn(message: string, context?: unknown): void {
    console.warn(
      `[WARN] ${new Date().toISOString()} - ${message}`,
      context || ""
    );
  }
}

// =====================================================
// UTILITAIRES DE PERFORMANCE
// =====================================================

/**
 * Classe utilitaire pour la mesure de performance
 */
export class Performance {
  /**
   * Mesure le temps d'exécution d'une fonction
   * @param {string} label Label pour identifier la mesure
   * @param {function} fn Fonction à mesurer
   * @return {Promise<T>} Résultat de la fonction
   */
  static async measure<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = process.hrtime.bigint();

    try {
      const result = await fn();
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // En millisecondes

      Logger.debug(
        `Performance: ${label} - ${duration.toFixed(2)}ms`
      );

      return result;
    } catch (error) {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000;

      Logger.error(
        `Performance: ${label} failed after ${duration.toFixed(2)}ms`,
        error
      );
      throw error;
    }
  }

  /**
   * Debounce pour limiter les appels fréquents
   * @param {function} func Fonction à debouncer
   * @param {number} wait Temps d'attente en ms
   * @return {function} Fonction debouncée
   */
  static debounce<T extends(...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): T {
    let timeout: NodeJS.Timeout;

    return ((...args: unknown[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  }

  /**
   * Throttle pour limiter la fréquence d'exécution
   * @param {function} func Fonction à throttler
   * @param {number} limit Limite en ms
   * @return {function} Fonction throttlée
   */
  static throttle<T extends(...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): T {
    let inThrottle: boolean;

    return ((...args: unknown[]) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }
}
