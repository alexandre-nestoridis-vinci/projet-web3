/**
 * News Controller
 * Gère les endpoints HTTP pour les articles
 */

import {Request, Response} from "express";
import * as newsRepository from "../data/newsRepository";
import * as aiNewsService from "../services/aiNewsService";

/**
 * GET /api/news
 * Récupère les articles, optionnellement filtrés par catégorie
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function getNews(req: Request, res: Response) {
  const category = String(req.query.category || "").trim();
  const limit = Number(req.query.limit || 20);

  try {
    const articles = await newsRepository.getArticles(category, limit);

    res.json({
      ok: true,
      articles,
    });
  } catch (e: unknown) {
    console.error("List error:", e);
    res.status(500).json({
      ok: false,
      error: String(e),
    });
  }
}

/**
 * GET /api/articles/:id
 * Récupère un article par son ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function getArticleById(req: Request, res: Response) {
  const articleId = req.params.id;

  try {
    const article = await newsRepository.getArticleById(articleId);

    if (!article) {
      return res.status(404).json({
        ok: false,
        error: "Article not found",
      });
    }

    return res.json({
      ok: true,
      article,
    });
  } catch (e) {
    console.error("Get article error:", e);
    return res.status(500).json({
      ok: false,
      error: String(e),
    });
  }
}

/**
 * POST /api/fetch-ai-news
 * Récupère les news via une IA et les stocke dans Firestore
 * Body: { category: "informatique", forceRefresh?: boolean }
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function fetchAINews(req: Request, res: Response) {
  const category = String(req.body?.category || "informatique");
  const forceRefresh = Boolean(req.body?.forceRefresh || false);

  try {
    const result = await aiNewsService.fetchRealNewsWithAI(
      category,
      5,
      forceRefresh
    );

    if (result.success) {
      return res.json({
        ok: true,
        message: result.message,
        addedCount: result.articles.length,
        articles: result.articles,
      });
    } else {
      return res.status(200).json({
        ok: false,
        message: result.message,
      });
    }
  } catch (e) {
    console.error("Fetch AI news error:", e);
    return res.status(500).json({
      ok: false,
      error: String(e),
    });
  }
}
