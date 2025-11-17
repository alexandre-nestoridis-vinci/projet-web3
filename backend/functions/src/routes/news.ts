import express from "express";
import {NewsRepository} from "../data/newsRepository";
import {middlewares} from "../middleware";
import {Logger, AppError} from "../utils/validation";
import {HTTP_STATUS} from "../config/constants";

/**
 * Routes pour la gestion des articles de news
 */

export const newsRouter = express.Router();
const newsRepo = new NewsRepository();

// =====================================================
// ROUTES ARTICLES
// =====================================================

/**
 * GET /api/news
 * Récupère les articles avec filtres et pagination
 */
newsRouter.get("/",
  middlewares.cache(300), // Cache 5 minutes
  middlewares.validateSearch,
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const {
        category,
        limit = 20,
        offset = 0,
        sortBy = "publishedAt",
        sortOrder = "desc",
        dateFrom,
        dateTo,
        source,
        status = "published",
      } = req.query;

      const filter = {
        category: category as string,
        limit: Math.min(parseInt(limit as string, 10), 100),
        offset: parseInt(offset as string, 10),
        sortBy: sortBy as "publishedAt" | "popularity" | "views",
        sortOrder: sortOrder as "asc" | "desc",
        dateFrom: dateFrom ?
          new Date(dateFrom as string) : undefined,
        dateTo: dateTo ?
          new Date(dateTo as string) : undefined,
        source: source as string,
        status: status as "draft" | "published" | "archived",
      };

      Logger.info("Récupération des articles", {filter});

      const articles = await newsRepo.getArticles(filter);

      res.json({
        success: true,
        data: articles,
        total: articles.length,
        filter,
        pagination: {
          limit: filter.limit,
          offset: filter.offset,
          hasMore: articles.length === filter.limit,
        },
      });
    } catch (error) {
      Logger.error("Erreur lors de la récupération des articles", error);
      next(AppError.database("Erreur lors de la récupération des articles"));
    }
  }
);

/**
 * GET /api/news/:id
 * Récupère un article par son ID avec analyse IA
 */
newsRouter.get("/:id",
  middlewares.validateArticleId,
  middlewares.cache(600), // Cache 10 minutes
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const {id} = req.params;

      Logger.info(`Récupération de l'article ${id}`);

      // Incrémenter les vues de manière asynchrone
      newsRepo.incrementViews(id).catch((error: Error) => {
        Logger.warn(
          "Erreur lors de l'incrémentation des vues",
          error
        );
      });

      // Récupérer l'article
      const article = await newsRepo.getArticleById(id);

      if (!article) {
        throw AppError.notFound("Article non trouvé", {id});
      }

      // Articles similaires en parallèle
      const [similarArticles] = await Promise.allSettled([
        newsRepo.getSimilarArticles(id, 5),
      ]);

      const responseData = {
        ...article,
        similarArticles: similarArticles.status === "fulfilled" ?
          similarArticles.value : [],
      };

      res.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        Logger.error(
          "Erreur lors de la récupération de l'article",
          error
        );
        next(AppError.database(
          "Erreur lors de la récupération de l'article"
        ));
      }
    }
  }
);

/**
 * POST /api/news/:id/views
 * Incrémente les vues d'un article
 */
newsRouter.post("/:id/views",
  middlewares.validateArticleId,
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const {id} = req.params;

      await newsRepo.incrementViews(id);

      res.status(HTTP_STATUS.NO_CONTENT).end();
    } catch (error) {
      Logger.error(
        "Erreur lors de l'incrémentation des vues",
        error
      );
      next(AppError.database(
        "Erreur lors de l'incrémentation des vues"
      ));
    }
  }
);

/**
 * GET /api/news/category/:category
 * Récupère les articles d'une catégorie spécifique
 */
newsRouter.get("/category/:category",
  middlewares.cache(300),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const {category} = req.params;
      const {limit = 20, offset = 0} = req.query;

      const filter = {
        category,
        limit: Math.min(parseInt(limit as string, 10), 100),
        offset: parseInt(offset as string, 10),
        status: "published" as const,
      };

      const articles = await newsRepo.getArticles(filter);

      res.json({
        success: true,
        data: articles,
        category,
        total: articles.length,
        pagination: {
          limit: filter.limit,
          offset: filter.offset,
          hasMore: articles.length === filter.limit,
        },
      });
    } catch (error) {
      Logger.error(
        "Erreur lors de la récupération par catégorie",
        error
      );
      next(AppError.database(
        "Erreur lors de la récupération par catégorie"
      ));
    }
  }
);

/**
 * GET /api/news/popular/trending
 * Récupère les articles populaires/tendance
 */
newsRouter.get("/popular/trending",
  middlewares.cache(600), // Cache 10 minutes
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const {limit = 10} = req.query;

      const filter = {
        limit: Math.min(
          parseInt(limit as string, 10),
          50
        ),
        sortBy: "popularity" as const,
        sortOrder: "desc" as const,
        status: "published" as const,
      };

      const articles = await newsRepo.getArticles(filter);

      res.json({
        success: true,
        data: articles,
        total: articles.length,
      });
    } catch (error) {
      Logger.error(
        "Erreur lors de la récupération des articles populaires",
        error
      );
      next(AppError.database(
        "Erreur lors de la récupération des articles populaires"
      ));
    }
  }
);

export {newsRouter as newsRoutes};
