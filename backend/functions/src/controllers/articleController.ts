/**
 * Article Controller
 * Handles HTTP requests related to articles
 */

import {Request, Response} from "express";
import {getArticles, getArticleById} from "../data/articleRepository";

/**
 * GET /api/news
 * Retrieve articles, optionally filtered by category
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getNewsHandler(req: Request, res: Response) {
  const category = String(req.query.category || "").trim();
  const limit = Number(req.query.limit || 20);

  try {
    const list = await getArticles(category || undefined, limit);

    res.json({
      ok: true,
      articles: list,
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
 * Get single article by ID
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getArticleByIdHandler(req: Request, res: Response) {
  const articleId = req.params.id;

  try {
    const article = await getArticleById(articleId);

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
 * POST /api/news/fetch
 * DEPRECATED - Use /api/fetch-ai-news instead
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function deprecatedFetchNewsHandler(req: Request, res: Response) {
  res.status(410).json({
    ok: false,
    message: "This endpoint is deprecated. Use /api/fetch-ai-news instead",
  });
}
