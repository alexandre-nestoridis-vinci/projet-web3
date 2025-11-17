import express from "express";
import {NewsRepository} from "../data/newsRepository";
import {middlewares} from "../middleware";
import {Logger, AppError} from "../utils/validation";
import {HTTP_STATUS} from "../config/constants";

/**
 * Routes pour la recherche et les suggestions
 */

export const searchRouter = express.Router();
const searchRepo = new NewsRepository();

// =====================================================
// ROUTES DE RECHERCHE
// =====================================================

/**
 * GET /api/search
 * Recherche d'articles avec filtres
 */
searchRouter.get("/",
  middlewares.validateSearch,
  middlewares.cache(180), // Cache 3 minutes
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const {q, category, limit = 20, offset = 0} = req.query;

      if (!q || typeof q !== "string") {
        throw AppError.validation(
          "Paramètre de recherche \"q\" requis"
        );
      }

      const filter = {
        category: category as string,
        limit: Math.min(
          parseInt(limit as string, 10),
          100
        ),
        offset: parseInt(offset as string, 10),
      };

      Logger.info("Recherche d'articles", {query: q, filter});

      const articles = await searchRepo.searchArticles(q, filter);

      res.json({
        success: true,
        data: articles,
        query: q,
        total: articles.length,
        pagination: {
          limit: filter.limit,
          offset: filter.offset,
          hasMore: articles.length === filter.limit,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        Logger.error("Erreur lors de la recherche", error);
        next(AppError.database("Erreur lors de la recherche"));
      }
    }
  }
);

/**
 * GET /api/search/suggestions
 * Suggestions de recherche basées sur une requête partielle
 */
searchRouter.get("/suggestions",
  middlewares.cache(900), // Cache 15 minutes
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const {q, limit = 10} = req.query;

      if (!q || typeof q !== "string") {
        res.json({
          success: true,
          data: [],
          query: q || "",
        });
        return;
      }

      if (q.length < 2) {
        res.json({
          success: true,
          data: [],
          query: q,
          message:
            "Requête trop courte pour générer des suggestions",
        });
        return;
      }

      Logger.info("Génération de suggestions", {query: q});

      const suggestions = await searchRepo.getSearchSuggestions(
        q,
        parseInt(limit as string) || 10
      );

      res.json({
        success: true,
        data: suggestions,
        query: q,
        total: suggestions.length,
      });
    } catch (error) {
      Logger.error(
        "Erreur lors de la génération de suggestions",
        error
      );
      next(AppError.database(
        "Erreur lors de la génération de suggestions"
      ));
    }
  }
);

/**
 * GET /api/search/trending
 * Termes de recherche populaires/tendance
 */
searchRouter.get("/trending",
  middlewares.cache(1800), // Cache 30 minutes
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const {limit = 10} = req.query;

      Logger.info("Récupération des termes populaires");

      // Implémentation basique - à améliorer avec de vraies métriques
      const trendingTerms = await searchRepo.getTrendingSearchTerms(
        parseInt(limit as string) || 10
      );

      res.json({
        success: true,
        data: trendingTerms,
        total: trendingTerms.length,
      });
    } catch (error) {
      Logger.error(
        "Erreur lors de la récupération des termes populaires",
        error
      );
      next(AppError.database(
        "Erreur lors de la récupération des termes populaires"
      ));
    }
  }
);

/**
 * POST /api/search/log
 * Enregistre une recherche pour les statistiques
 */
searchRouter.post("/log",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const {query, category, resultCount, userId} = req.body;

      if (!query || typeof query !== "string") {
        throw AppError.validation(
          "Requête de recherche requise"
        );
      }

      Logger.info(
        "Enregistrement de recherche",
        {query, category, resultCount}
      );

      await searchRepo.logSearch({
        query: query.trim(),
        category: category || null,
        resultCount: resultCount || 0,
        userId: userId || null,
        timestamp: new Date(),
        ip: req.ip ||
          req.connection.remoteAddress ||
          "unknown",
      });

      res.status(HTTP_STATUS.NO_CONTENT).end();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        Logger.error("Erreur lors de l'enregistrement de recherche", error);
        next(AppError.database("Erreur lors de l'enregistrement de recherche"));
      }
    }
  }
);

/**
 * GET /api/search/stats
 * Statistiques de recherche
 */
searchRouter.get("/stats",
  middlewares.cache(3600), // Cache 1 heure
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      Logger.info("Récupération des statistiques de recherche");

      const stats = await searchRepo.getSearchStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      Logger.error(
        "Erreur lors de la récupération des statistiques",
        error
      );
      next(AppError.database(
        "Erreur lors de la récupération des statistiques"
      ));
    }
  }
);

export {searchRouter as searchRoutes};
