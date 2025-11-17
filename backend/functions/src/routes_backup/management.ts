import {Router} from "express";
import * as logger from "firebase-functions/logger";
import {CRUDService} from "../services/crudService";
import {NewsService} from "../services/newsService";
import {AIService} from "../services/aiService";

const router = Router();
const crudService = new CRUDService();
const newsService = new NewsService();
const aiService = new AIService();

// ===== ROUTES GESTION DES ARTICLES =====

/**
 * POST /api/management/articles - Créer un article
 */
router.post("/articles", async (req, res) => {
  try {
    const validation = Validator.validateArticle(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    const articleId = await crudService.createArticle(req.body);

    res.status(201).json({
      success: true,
      data: {id: articleId},
      message: "Article créé avec succès",
    });
  } catch (error) {
    logger.error("Erreur création article:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la création de l'article",
    });
  }
});

/**
 * GET /api/management/articles - Lister les articles
 */
router.get("/articles", async (req, res) => {
  try {
    const {
      limit = 20,
      offset = 0,
      orderBy = "publishedAt",
      orderDirection = "desc",
      status = "published",
    } = req.query;

    const result = await crudService.listArticles({
      limit: Number(limit),
      offset: Number(offset),
      orderBy: orderBy as string,
      orderDirection: orderDirection as "asc" | "desc",
      status: status as string,
    });

    res.json({
      success: true,
      data: result.articles,
      total: result.total,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        hasMore: result.articles.length === Number(limit),
      },
    });
  } catch (error) {
    logger.error("Erreur listage articles:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors du listage des articles",
    });
  }
});

/**
 * GET /api/management/articles/:id - Obtenir un article
 */
router.get("/articles/:id", async (req, res) => {
  try {
    const article = await crudService.readArticle(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        error: "Article non trouvé",
      });
    }

    // Incrémenter les vues
    await crudService.incrementViews(req.params.id);

    res.json({
      success: true,
      data: article,
    });
  } catch (error) {
    logger.error("Erreur récupération article:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de l'article",
    });
  }
});

/**
 * PUT /api/management/articles/:id - Mettre à jour un article
 */
router.put("/articles/:id", async (req, res) => {
  try {
    const success = await crudService.updateArticle(req.params.id, req.body);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: "Article non trouvé ou erreur de mise à jour",
      });
    }

    res.json({
      success: true,
      message: "Article mis à jour avec succès",
    });
  } catch (error) {
    logger.error("Erreur mise à jour article:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour de l'article",
    });
  }
});

/**
 * DELETE /api/management/articles/:id - Supprimer un article
 */
router.delete("/articles/:id", async (req, res) => {
  try {
    const success = await crudService.deleteArticle(req.params.id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: "Article non trouvé",
      });
    }

    res.json({
      success: true,
      message: "Article supprimé avec succès",
    });
  } catch (error) {
    logger.error("Erreur suppression article:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression de l'article",
    });
  }
});

// ===== ROUTES GESTION DES CATÉGORIES =====

/**
 * GET /api/management/categories - Lister les catégories
 */
router.get("/categories", async (req, res) => {
  try {
    const categories = await crudService.listCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error("Erreur listage catégories:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors du listage des catégories",
    });
  }
});

/**
 * POST /api/management/categories - Créer une catégorie
 */
router.post("/categories", async (req, res) => {
  try {
    const categoryId = await crudService.createCategory(req.body);

    res.status(201).json({
      success: true,
      data: {id: categoryId},
      message: "Catégorie créée avec succès",
    });
  } catch (error) {
    logger.error("Erreur création catégorie:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la création de la catégorie",
    });
  }
});

/**
 * PUT /api/management/categories/:id - Mettre à jour une catégorie
 */
router.put("/categories/:id", async (req, res) => {
  try {
    const success = await crudService.updateCategory(req.params.id, req.body);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: "Catégorie non trouvée",
      });
    }

    res.json({
      success: true,
      message: "Catégorie mise à jour avec succès",
    });
  } catch (error) {
    logger.error("Erreur mise à jour catégorie:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour de la catégorie",
    });
  }
});

/**
 * DELETE /api/management/categories/:id - Supprimer une catégorie
 */
router.delete("/categories/:id", async (req, res) => {
  try {
    const success = await crudService.deleteCategory(req.params.id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: "Catégorie non trouvée",
      });
    }

    res.json({
      success: true,
      message: "Catégorie supprimée avec succès",
    });
  } catch (error) {
    logger.error("Erreur suppression catégorie:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression de la catégorie",
    });
  }
});

// ===== ROUTES DE RECHERCHE =====

/**
 * GET /api/management/search - Recherche full-text
 */
router.get("/search", async (req, res) => {
  try {
    const {q, category, limit = 20} = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        success: false,
        error: "Paramètre de recherche 'q' requis",
      });
    }

    const results = await crudService.searchArticles(q, {
      category: category as string,
      limit: Number(limit),
    });

    res.json({
      success: true,
      data: results,
      query: q,
      total: results.length,
    });
  } catch (error) {
    logger.error("Erreur recherche:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la recherche",
    });
  }
});

// ===== ROUTES RÉCUPÉRATION DE NEWS =====

/**
 * POST /api/management/fetch-news - Récupération manuelle des news
 */
router.post("/fetch-news", async (req, res) => {
  try {
    const {source = "all", category = "general"} = req.body;

    const articles = [];
    if (source === "newsapi" || source === "all") {
      const newsApiArticles = await newsService.fetchFromNewsAPI(category);
      articles.push(...newsApiArticles);
    }

    if (source === "rss" || source === "all") {
      const rssArticles = await newsService.fetchFromRSS();
      articles.push(...rssArticles);
    }

    // Déduplication
    const uniqueArticles = await newsService.deduplicateArticles(articles);

    // Sauvegarde
    const savedIds = [];
    for (const article of uniqueArticles) {
      try {
        const id = await crudService.createArticle(article);
        savedIds.push(id);
      } catch (error) {
        logger.error("Erreur sauvegarde article:", error);
      }
    }

    res.json({
      success: true,
      data: {
        fetched: articles.length,
        unique: uniqueArticles.length,
        saved: savedIds.length,
        ids: savedIds,
      },
      message: `${savedIds.length} nouveaux articles sauvegardés`,
    });
  } catch (error) {
    logger.error("Erreur récupération news:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des actualités",
    });
  }
});

// ===== ROUTES IA =====

/**
 * POST /api/management/analyze - Analyse IA d'un article
 */
router.post("/analyze/:id", async (req, res) => {
  try {
    const article = await crudService.readArticle(req.params.id);
    if (!article) {
      return res.status(404).json({
        success: false,
        error: "Article non trouvé",
      });
    }

    const [aiAnalysis, fakeNewsDetection, categoryClassification] =
      await Promise.all([
        aiService.analyzeArticle({
          articleId: article.id,
          title: article.title,
          content: article.content,
        }),
        aiService.detectFakeNews({
          title: article.title,
          content: article.content,
          source: article.source,
          url: article.url,
        }),
        aiService.classifyCategory(article.title, article.content),
      ]);

    // Mise à jour de l'article avec les résultats d'analyse
    await crudService.updateArticle(article.id, {
      sentiment: aiAnalysis.sentiment,
      keywords: aiAnalysis.keywords,
      popularity: fakeNewsDetection.score,
    });

    res.json({
      success: true,
      data: {
        analysis: aiAnalysis,
        fakeNewsDetection,
        categoryClassification,
      },
    });
  } catch (error) {
    logger.error("Erreur analyse IA:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de l'analyse IA",
    });
  }
});

/**
 * GET /api/management/cache/clear - Vider le cache
 */
router.post("/cache/clear", async (req, res) => {
  try {
    crudService.clearCache();
    res.json({
      success: true,
      message: "Cache vidé avec succès",
    });
  } catch (error) {
    logger.error("Erreur vidage cache:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors du vidage du cache",
    });
  }
});

export default router;
