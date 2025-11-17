/**
 * Point d'entrée principal de l'application Firebase Functions
 * Implémente les bonnes pratiques d'architecture et de sécurité
 */

import {onRequest} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

import {ENVIRONMENT} from "./config/constants";
import {NewsRepository} from "./data/newsRepository";
import {AIService} from "./services/aiService";

// =====================================================
// CONFIGURATION GLOBALE
// =====================================================

// Initialize Firebase Admin
initializeApp();

// Configuration optimisée des fonctions
setGlobalOptions({
  region: "europe-west1",
  memory: "1GiB",
  timeoutSeconds: 60,
  maxInstances: 10,
  minInstances: ENVIRONMENT.IS_PRODUCTION ? 1 : 0,
  concurrency: 10,
});

// =====================================================
// SERVICES GLOBAUX
// =====================================================

const newsRepo = new NewsRepository();
const aiService = new AIService();

// Test de connexion Firestore depuis le backend
export const testFirestore = onRequest(async (request, response) => {
  // Headers CORS
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    const db = getFirestore();

    // Test d'écriture en base
    const testDoc = {
      message: "Test depuis Cloud Functions",
      timestamp: new Date(),
      source: "backend",
    };

    const docRef = await db.collection("backend-tests").add(testDoc);

    logger.info("Document ajouté avec ID:", docRef.id);

    response.json({
      success: true,
      message: "Connexion Firestore réussie depuis le backend!",
      docId: docRef.id,
    });
  } catch (error) {
    logger.error("Erreur Firestore:", error);
    response.status(500).json({
      success: false,
      error: "Erreur de connexion Firestore",
    });
  }
});

// Import des services pour les catégories
import {MockDataService} from "./services/mockDataService";

// Services déjà déclarés plus haut

// 📰 API pour récupérer les articles avec filtres
export const getArticles = onRequest(async (request, response) => {
  // Headers CORS
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

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
    } = request.query;

    const filter = {
      category: category as string,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      sortBy: sortBy as "publishedAt" | "popularity" | "views",
      sortOrder: sortOrder as "asc" | "desc",
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      source: source as string,
      status: status as "draft" | "published" | "archived",
    };

    let articles = await newsRepo.getArticles(filter);

    // Si aucun article, essayer de peupler avec des données de test
    if (articles.length === 0) {
      try {
        const {MockDataService} = await import("./services/mockDataService.js");
        const mockService = new MockDataService();

        logger.info("Aucun article trouvé - Génération de données de test");
        await mockService.populateDatabase("all");

        // Re-récupérer les articles
        articles = await newsRepo.getArticles(filter);
        logger.info(`${articles.length} articles générés et récupérés`);
      } catch (popError) {
        logger.warn("Erreur génération données de test:", popError);
      }
    }

    response.json({
      success: true,
      data: articles,
      total: articles.length,
      filter,
      generated: articles.length > 0 ? "Articles disponibles" : "Aucun article",
    });
  } catch (error) {
    logger.error("Erreur getArticles:", error);
    response.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des articles",
    });
  }
});

// 🔍 API pour rechercher des articles
export const searchArticles = onRequest(async (request, response) => {
  // Headers CORS
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    const {q, category, limit = 10} = request.query;

    if (!q) {
      response.status(400).json({
        success: false,
        error: "Paramètre de recherche 'q' requis",
      });
      return;
    }

    const filter = {
      category: category as string,
      limit: parseInt(limit as string, 10),
    };

    const articles = await newsRepo.searchArticles(q as string, filter);

    response.json({
      success: true,
      data: articles,
      query: q,
      total: articles.length,
    });
  } catch (error) {
    logger.error("Erreur searchArticles:", error);
    response.status(500).json({
      success: false,
      error: "Erreur lors de la recherche",
    });
  }
});

// 📄 API pour récupérer un article par ID
export const getArticle = onRequest(async (request, response) => {
  // Headers CORS
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    const {id} = request.query;

    if (!id) {
      response.status(400).json({
        success: false,
        error: "ID article requis",
      });
      return;
    }

    // Incrémenter les vues
    await newsRepo.incrementViews(id as string);

    // Récupérer l'article
    const article = await newsRepo.getArticleById(id as string);

    if (!article) {
      response.status(404).json({
        success: false,
        error: "Article non trouvé",
      });
      return;
    }

    // Récupérer l'analyse IA si disponible
    const aiAnalysis = await aiService.getAnalysisForArticle(id as string);

    // Articles similaires
    const similarArticles = await newsRepo.getSimilarArticles(id as string, 5);

    response.json({
      success: true,
      data: {
        ...article,
        aiAnalysis,
        similarArticles,
      },
    });
  } catch (error) {
    logger.error("Erreur getArticle:", error);
    response.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de l'article",
    });
  }
});

// 🤖 API pour analyser un article avec IA
export const analyzeArticleWithAI = onRequest(async (request, response) => {
  // Headers CORS
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    const {articleId} = request.body;

    if (!articleId) {
      response.status(400).json({
        success: false,
        error: "ID article requis",
      });
      return;
    }

    // Récupérer l'article
    const article = await newsRepo.getArticleById(articleId);
    if (!article) {
      response.status(404).json({
        success: false,
        error: "Article non trouvé",
      });
      return;
    }

    // Analyser avec IA
    const analysis = await aiService.analyzeArticle({
      articleId: article.id,
      title: article.title,
      content: article.content,
    });

    response.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    logger.error("Erreur analyzeArticleWithAI:", error);
    response.status(500).json({
      success: false,
      error: "Erreur lors de l'analyse IA",
    });
  }
});

// 💡 API pour suggestions de recherche
export const getSearchSuggestions = onRequest(async (request, response) => {
  // Headers CORS
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    const {q, limit = 10} = request.query;

    if (!q) {
      response.json({
        success: true,
        data: [],
      });
      return;
    }

    const suggestions = await newsRepo.getSearchSuggestions(
      q as string,
      parseInt(limit as string, 10)
    );

    response.json({
      success: true,
      data: suggestions,
      query: q,
    });
  } catch (error) {
    logger.error("Erreur getSearchSuggestions:", error);
    response.status(500).json({
      success: false,
      error: "Erreur lors de la génération de suggestions",
    });
  }
});

// 📊 API pour statistiques des catégories
export const getCategoryStats = onRequest(async (request, response) => {
  // Headers CORS
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    const stats = await newsRepo.getCategoryStats();

    response.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Erreur getCategoryStats:", error);
    response.status(500).json({
      success: false,
      error: "Erreur lors du calcul des statistiques",
    });
  }
});

// 📈 API pour statistiques IA
export const getAIStats = onRequest(async (request, response) => {
  // Headers CORS
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    const stats = await aiService.getAIStats();

    response.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Erreur getAIStats:", error);
    response.status(500).json({
      success: false,
      error: "Erreur lors du calcul des statistiques IA",
    });
  }
});

// API pour récupérer les news (ancien - gardé pour compatibilité)
export const fetchNews = onRequest(async (request, response) => {
  // Headers CORS
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  // Rediriger vers getArticles
  try {
    const articles = await newsRepo.getArticles({limit: 10});
    response.json({
      success: true,
      data: articles,
      message: "Utilisez /getArticles pour plus d'options de filtrage",
    });
  } catch (error) {
    response.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des articles",
    });
  }
});

// API pour traitement IA (ancien - gardé pour compatibilité)
export const processWithAI = onRequest(async (request, response) => {
  // Headers CORS
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  response.json({
    success: true,
    message: "Utilisez /analyzeArticleWithAI pour l'analyse complète",
    availableEndpoints: [
      "/analyzeArticleWithAI",
      "/getSearchSuggestions",
      "/getAIStats",
    ],
  });
});

// 📂 API pour récupérer les articles par catégorie
export const fetchNewsByCategory = onRequest(async (request, response) => {
  // Headers CORS
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    const category = request.query.category as string;
    const limit = Number(request.query.limit) || 10;
    const force = request.query.force === "true";

    if (!category) {
      response.status(400).json({
        success: false,
        error: "Paramètre 'category' requis",
      });
      return;
    }

    logger.info(`Récupération des news pour la catégorie: ${category}`);

    const mockService = new MockDataService();
    let articles = await newsRepo.getArticlesByCategory(category);

    // Si pas d'articles ou force refresh, générer des données
    if (articles.length === 0 || force) {
      logger.info(`Génération d'articles pour la catégorie: ${category}`);

      const result = await mockService.populateDatabase(category);
      articles = await newsRepo.getArticlesByCategory(category);

      logger.info(`${result.saved} nouveaux articles créés pour ${category}`);
    }

    const limitedArticles = articles.slice(0, limit);

    response.json({
      success: true,
      data: limitedArticles,
      category,
      total: limitedArticles.length,
      message: `${limitedArticles.length} articles récupérés pour ${category}`,
    });
  } catch (error) {
    logger.error("Erreur récupération catégorie:", error);
    response.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des actualités",
    });
  }
});

// 📂 API pour obtenir toutes les catégories
export const getCategories = onRequest(async (request, response) => {
  // Headers CORS
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    const mockService = new MockDataService();
    const categories = mockService.getCategories();

    response.json({
      success: true,
      data: categories,
      total: categories.length,
    });
  } catch (error) {
    logger.error("Erreur récupération catégories:", error);
    response.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des catégories",
    });
  }
});

// 📂 API pour peupler toutes les catégories
export const populateAllCategories = onRequest(async (request, response) => {
  // Headers CORS
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  try {
    logger.info("Peuplement de toutes les catégories");

    const mockService = new MockDataService();
    const result = await mockService.populateDatabase("all");

    response.json({
      success: true,
      data: result,
      message: `${result.saved} articles générés pour toutes les catégories`,
    });
  } catch (error) {
    logger.error("Erreur peuplement complet:", error);
    response.status(500).json({
      success: false,
      error: "Erreur lors du peuplement de la base de données",
    });
  }
});
