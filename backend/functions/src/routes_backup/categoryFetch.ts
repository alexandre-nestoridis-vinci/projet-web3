import {Router} from "express";
import * as logger from "firebase-functions/logger";
import {MockDataService} from "../services/mockDataService";
import {NewsRepository} from "../data/newsRepository";

const router = Router();
const mockDataService = new MockDataService();
const newsRepository = new NewsRepository();

/**
 * GET /api/fetch-news/:category - Récupérer les news d'une catégorie spécifique
 */
router.get("/fetch-news/:category", async (req, res) => {
  try {
    const {category} = req.params;
    const {limit = 10, force = false} = req.query;

    logger.info(`Récupération des news pour la catégorie: ${category}`);

    // Vérifier si des articles existent déjà pour cette catégorie
    let articles = await newsRepository.getArticlesByCategory(category);

    // Si pas d'articles ou force refresh, générer des données
    if (articles.length === 0 || force === "true") {
      logger.info(`Génération d'articles pour la catégorie: ${category}`);

      // Peupler avec des données de test
      const result = await mockDataService.populateDatabase(category);

      // Re-récupérer les articles
      articles = await newsRepository.getArticlesByCategory(category);

      logger.info(`${result.saved} nouveaux articles créés pour ${category}`);
    }

    // Limiter le nombre d'articles retournés
    const limitedArticles = articles.slice(0, Number(limit));

    res.json({
      success: true,
      data: limitedArticles,
      category,
      total: limitedArticles.length,
      message: `${limitedArticles.length} articles récupérés pour ${category}`,
    });
  } catch (error) {
    logger.error(`Erreur récupération catégorie ${req.params.category}:`, error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des actualités",
      category: req.params.category,
    });
  }
});

/**
 * POST /api/populate-all - Peupler toutes les catégories avec des données de test
 */
router.post("/populate-all", async (req, res) => {
  try {
    logger.info("Peuplement de toutes les catégories");

    const result = await mockDataService.populateDatabase("all");

    res.json({
      success: true,
      data: result,
      message: `${result.saved} articles générés pour toutes les catégories`,
    });
  } catch (error) {
    logger.error("Erreur peuplement complet:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors du peuplement de la base de données",
    });
  }
});

/**
 * GET /api/categories - Obtenir toutes les catégories disponibles
 */
router.get("/categories", async (req, res) => {
  try {
    const categories = mockDataService.getCategories();

    res.json({
      success: true,
      data: categories,
      total: categories.length,
    });
  } catch (error) {
    logger.error("Erreur récupération catégories:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des catégories",
    });
  }
});

export default router;
export {router as categoryFetchRoutes};
