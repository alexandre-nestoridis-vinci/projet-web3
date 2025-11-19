/**
 * AI News Controller
 * Handles HTTP requests for AI-powered news fetching
 */

import {Request, Response} from "express";
import {fetchRealNewsWithAI} from "../services/aiNewsService";

/**
 * POST /api/fetch-ai-news
 * Fetch news via AI and store them in Firestore
 * Body: { category: "informatique", forceRefresh?: boolean }
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function fetchAINewsHandler(req: Request, res: Response) {
  const category = String(req.body?.category || "informatique");
  const forceRefresh = Boolean(req.body?.forceRefresh || false);

  try {
    const result = await fetchRealNewsWithAI(category, 5, forceRefresh);

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
