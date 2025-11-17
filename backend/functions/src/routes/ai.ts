import express from "express";
import {AIService} from "../services/aiService";
import {NewsRepository} from "../data/newsRepository";
import {middlewares, validateArticleId} from "../middleware";
import {Logger, AppError} from "../utils/validation";
import {HTTP_STATUS} from "../config/constants";

/**
 * Routes pour les services d'IA et analyses
 */

export const aiRouter = express.Router();
const aiService = new AIService();
const newsRepo = new NewsRepository();

// =====================================================
// ROUTES ANALYSE IA
// =====================================================

/**
 * POST /api/ai/analyze/:id
 * Analyse un article avec l'IA
 */
aiRouter.post("/analyze/:id",
  validateArticleId,
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const {id} = req.params;

      Logger.info(`Analyse IA demandée pour l'article ${id}`);

      // Vérifier que l'article existe
      const article = await newsRepo.getArticleById(id);
      if (!article) {
        throw AppError.notFound("Article non trouvé", {id});
      }

      // Vérifier si une analyse existe déjà
      const existingAnalysis = await aiService.getAnalysisForArticle(id);
      if (existingAnalysis) {
        Logger.info("Analyse IA existante trouvée", {id});
        res.json({
          success: true,
          data: existingAnalysis,
          fromCache: true,
        });
        return;
      }

      // Lancer l'analyse IA
      const analysis = await aiService.analyzeArticle({
        articleId: article.id,
        title: article.title,
        content: article.content,
        category: typeof article.category === "string" ?
          article.category : article.category?.id,
      });

      Logger.info("Analyse IA terminée", {id, analysis: analysis.id});

      res.json({
        success: true,
        data: analysis,
        fromCache: false,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        Logger.error("Erreur lors de l'analyse IA", error);
        next(AppError.aiService("Erreur lors de l'analyse IA"));
      }
    }
  }
);

/**
 * GET /api/ai/analysis/:id
 * Récupère l'analyse IA d'un article
 */
aiRouter.get("/analysis/:id",
  middlewares.validateArticleId,
  middlewares.cache(3600), // Cache 1 heure
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const {id} = req.params;

      Logger.info(`Récupération de l'analyse IA pour l'article ${id}`);

      const analysis = await aiService.getAnalysisForArticle(id);

      if (!analysis) {
        throw AppError.notFound("Analyse IA non trouvée", {id});
      }

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        Logger.error("Erreur lors de la récupération de l'analyse", error);
        next(AppError.database("Erreur lors de la récupération de l'analyse"));
      }
    }
  }
);

/**
 * POST /api/ai/batch-analyze
 * Analyse plusieurs articles en lot
 */
aiRouter.post("/batch-analyze",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const {articleIds, forceReanalyze = false} = req.body;

      if (!Array.isArray(articleIds) || articleIds.length === 0) {
        throw AppError.validation("Liste des IDs d'articles requise");
      }

      if (articleIds.length > 10) {
        throw AppError.validation("Maximum 10 articles par lot");
      }

      Logger.info("Analyse IA en lot demandée", {
        count: articleIds.length,
        forceReanalyze,
      });

      const results = await aiService.batchAnalyzeArticles(
        articleIds,
        forceReanalyze
      );

      res.json({
        success: true,
        data: results,
        processed: results.length,
        total: articleIds.length,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        Logger.error("Erreur lors de l'analyse en lot", error);
        next(AppError.aiService("Erreur lors de l'analyse en lot"));
      }
    }
  }
);

/**
 * GET /api/ai/stats
 * Statistiques des analyses IA
 */
aiRouter.get("/stats",
  middlewares.cache(1800), // Cache 30 minutes
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      Logger.info("Récupération des statistiques IA");

      const stats = await aiService.getAIStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      Logger.error(
        "Erreur lors de la récupération des statistiques IA",
        error
      );
      next(AppError.database(
        "Erreur lors de la récupération des statistiques IA"
      ));
    }
  }
);

/**
 * GET /api/ai/sentiment-trends
 * Tendances de sentiment par catégorie
 */
aiRouter.get("/sentiment-trends",
  middlewares.cache(3600), // Cache 1 heure
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const {category, days = 30} = req.query;

      Logger.info("Récupération des tendances de sentiment", {category, days});

      const trends = await aiService.getSentimentTrends({
        category: category as string,
        days: parseInt(days as string, 10),
      });

      res.json({
        success: true,
        data: trends,
        category: category || "all",
        period: `${days} days`,
      });
    } catch (error) {
      Logger.error("Erreur lors de la récupération des tendances", error);
      next(AppError.database("Erreur lors de la récupération des tendances"));
    }
  }
);

/**
 * GET /api/ai/keywords/popular
 * Mots-clés populaires extraits par l'IA
 */
aiRouter.get("/keywords/popular",
  middlewares.cache(1800), // Cache 30 minutes
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const {category, limit = 20} = req.query;

      Logger.info("Récupération des mots-clés populaires", {category, limit});

      const keywords = await aiService.getPopularKeywords({
        category: category as string,
        limit: Math.min(parseInt(limit as string, 10), 50),
      });

      res.json({
        success: true,
        data: keywords,
        category: category || "all",
        total: keywords.length,
      });
    } catch (error) {
      Logger.error("Erreur lors de la récupération des mots-clés", error);
      next(AppError.database("Erreur lors de la récupération des mots-clés"));
    }
  }
);

/**
 * GET /api/ai/health
 * Statut de santé des services IA
 */
aiRouter.get("/health",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      Logger.info("Vérification de la santé des services IA");

      const healthStatus = await aiService.checkHealth();

      const statusCode = healthStatus.status === "healthy" ?
        HTTP_STATUS.OK :
        HTTP_STATUS.SERVICE_UNAVAILABLE;

      res.status(statusCode).json({
        success: healthStatus.status === "healthy",
        data: healthStatus,
      });
    } catch (error) {
      Logger.error("Erreur lors de la vérification de santé IA", error);
      res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        success: false,
        data: {
          status: "unhealthy",
          error: "Service IA indisponible",
        },
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next;
  }
);

export {aiRouter as aiRoutes};
