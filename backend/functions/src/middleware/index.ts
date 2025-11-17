import {Request, Response, NextFunction} from "express";
import {AppError, Logger, Validator} from "../utils/validation";
import {HTTP_STATUS} from "../config/constants";

/**
 * Middleware pour l'application News IA
 * Implémente les bonnes pratiques de sécurité et gestion d'erreurs
 */

// =====================================================
// MIDDLEWARE DE SÉCURITÉ
// =====================================================

/**
 * Middleware de sécurité générale
 */
/**
 * Security middleware for setting secure HTTP headers
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 */
export const securityMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Headers de sécurité
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' " +
      "https://apis.google.com;"
  );

  // CORS configuré pour la production
  const allowedOrigins = [
    "http://localhost:4200", // Développement Angular
    "https://your-domain.com", // Production
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin as string)) {
    res.setHeader("Access-Control-Allow-Origin", origin as string);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 heures

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
};

/**
 * Middleware de limitation de taux (rate limiting)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = (
  maxRequests = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes par défaut
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();

    const clientData = requestCounts.get(clientIp);

    if (!clientData || now > clientData.resetTime) {
      // Nouveau client ou fenêtre expirée
      requestCounts.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }

    if (clientData.count >= maxRequests) {
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        error: "Trop de requêtes. Veuillez réessayer plus tard.",
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
      return;
    }

    clientData.count++;
    next();
  };
};

/**
 * Middleware de validation de taille de requête
 */
/**
 * Request size validation middleware
 * @param {number} maxSize Maximum allowed request size in bytes
 * @return {function} Middleware function
 */
export const requestSizeMiddleware = (
  maxSize: number = 10 * 1024 * 1024
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get("content-length") || "0");

    if (contentLength > maxSize) {
      res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        error: "Taille de requête trop importante",
        maxSize: `${maxSize / (1024 * 1024)}MB`,
      });
      return;
    }

    next();
  };
};

// =====================================================
// MIDDLEWARE DE VALIDATION
// =====================================================

/**
 * Middleware de validation des paramètres de recherche
 */
/**
 * Validate search parameters middleware
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 */
export const validateSearchParams = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const {query, category, page, limit} = req.query;

  // Validation de la requête de recherche
  if (query) {
    const queryValidation = Validator.validateSearchQuery(query as string);
    if (!queryValidation.isValid) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "Paramètres de recherche invalides",
        details: queryValidation.errors,
      });
      return;
    }
  }

  // Validation de la catégorie
  if (category) {
    const categoryValidation = Validator.validateCategory(category as string);
    if (!categoryValidation.isValid) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "Catégorie invalide",
        details: categoryValidation.errors,
      });
      return;
    }
  }

  // Validation de la pagination
  const pageNum = page ? parseInt(page as string) : undefined;
  const limitNum = limit ? parseInt(limit as string) : undefined;

  const paginationValidation = Validator.validatePagination(pageNum, limitNum);
  if (!paginationValidation.isValid) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: "Paramètres de pagination invalides",
      details: paginationValidation.errors,
    });
    return;
  }

  next();
};

/**
 * Middleware de validation des IDs d'article
 */
/**
 * Validate article ID middleware
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 */
export const validateArticleId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const {id} = req.params;

  const validation = Validator.validateArticleId(id);
  if (!validation.isValid) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: "ID d'article invalide",
      details: validation.errors,
    });
    return;
  }

  next();
};

/**
 * Middleware de validation du corps de requête pour les articles
 */
/**
 * Validate article body middleware
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 */
export const validateArticleBody = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const validation = Validator.validateArticle(req.body);

  if (!validation.isValid) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: "Données d'article invalides",
      details: validation.errors,
    });
    return;
  }

  next();
};

// =====================================================
// MIDDLEWARE DE GESTION D'ERREURS
// =====================================================

/**
 * Middleware de gestion des erreurs globales
 */
/**
 * Global error handler middleware
 * @param {Error | AppError} error Error object
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response
): void => {
  Logger.error("Erreur non gérée:", error, {
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Gestion des erreurs personnalisées
  if (error instanceof AppError) {
    res.status(error.statusCode).json(error.toJSON());
    return;
  }

  // Erreurs de validation JSON
  if (error instanceof SyntaxError && "body" in error) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: "Format JSON invalide",
    });
    return;
  }

  // Erreur générique
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: "Erreur interne du serveur",
  });
};

/**
 * Middleware pour les routes non trouvées
 */
/**
 * Handle 404 not found errors
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: "Route non trouvée",
    path: req.path,
    method: req.method,
  });
};

// =====================================================
// MIDDLEWARE DE LOGGING
// =====================================================

/**
 * Middleware de logging des requêtes
 */
/**
 * Request logging middleware
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
    };

    if (res.statusCode >= 400) {
      Logger.error("Requête échouée", logData);
    } else {
      Logger.info("Requête réussie", logData);
    }
  });

  next();
};

// =====================================================
// MIDDLEWARE DE CACHE
// =====================================================

/**
 * Middleware de cache pour les réponses
 */
/**
 * Cache middleware for response caching
 * @param {number} ttlSeconds Cache time to live in seconds
 * @return {function} Middleware function
 */
export const cacheMiddleware = (ttlSeconds = 300) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Cache seulement les requêtes GET
    if (req.method !== "GET") {
      next();
      return;
    }

    const etag = `"${Buffer.from(req.url).toString("base64")}"`;
    res.setHeader("ETag", etag);
    res.setHeader(
      "Cache-Control",
      `public, max-age=${ttlSeconds}`
    );

    // Vérification de l'ETag client
    if (req.headers["if-none-match"] === etag) {
      res.status(304).end();
      return;
    }

    next();
  };
};

// =====================================================
// MIDDLEWARE DE MONITORING
// =====================================================

/**
 * Middleware de monitoring de performance
 */
/**
 * Performance monitoring middleware
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 */
export const performanceMonitoring = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000;

    // Log des requêtes lentes
    if (duration > 1000) { // Plus de 1 seconde
      Logger.warn("Requête lente détectée", {
        url: req.url,
        method: req.method,
        duration: `${duration.toFixed(2)}ms`,
      });
    }

    // Métriques additionnelles en développement
    if (process.env.NODE_ENV === "development") {
      Logger.debug("Performance", {
        url: req.url,
        method: req.method,
        status: res.statusCode,
        duration: `${duration.toFixed(2)}ms`,
      });
    }
  });

  next();
};

// =====================================================
// MIDDLEWARE DE SANITISATION
// =====================================================

/**
 * Middleware de sanitisation des entrées
 */
/**
 * Input sanitization middleware
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 */
export const sanitizeInputs = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Sanitisation des paramètres de query
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") {
        req.query[key] = value.trim();
      }
    }
  }

  // Sanitisation du body pour les requêtes POST/PUT
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body as Record<string, unknown>);
  }

  next();
};

/**
 * Fonction utilitaire pour sanitiser récursivement un objet
 * @param {Record<string, unknown>} obj Object to sanitize
 */
const sanitizeObject = (obj: Record<string, unknown>): void => {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      obj[key] = value.trim();
    } else if (typeof value === "object" && value !== null) {
      sanitizeObject(value as Record<string, unknown>);
    }
  }
};

// =====================================================
// EXPORTATION GROUPÉE
// =====================================================

export const middlewares = {
  security: securityMiddleware,
  rateLimit: rateLimitMiddleware,
  requestSize: requestSizeMiddleware,
  validateSearch: validateSearchParams,
  validateArticleId,
  validateArticleBody,
  errorHandler,
  notFoundHandler,
  requestLogger,
  cache: cacheMiddleware,
  performance: performanceMonitoring,
  sanitize: sanitizeInputs,
};
