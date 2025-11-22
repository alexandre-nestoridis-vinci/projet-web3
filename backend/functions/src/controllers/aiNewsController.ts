/**
 * AI News Controller
 * Handles HTTP requests for AI-powered news fetching
 */

import {Request, Response} from "express";
import {defineSecret} from "firebase-functions/params";
import {fetchRealNewsWithAI} from "../services/aiNewsService";


const GEMINI_SECRET = defineSecret("GEMINI_API_KEY");

/**
 * POST /api/fetch-ai-news
 * Fetch news via AI and store them in Firestore
 * Body: { category: "informatique", forceRefresh?: boolean }
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function fetchAINewsHandler(req: Request, res: Response) {
  try {
    const category = String(req.body?.category || "informatique");
    const forceRefresh = Boolean(req.body?.forceRefresh || false);

    // Récupère la valeur du secret AU RUNTIME
    // (nécessite que onRequest ait été appelé avec `secrets: [GEMINI_SECRET]`)
    const key = await GEMINI_SECRET.value();
    if (!key) {
      console.error("Secret GEMINI_API_KEY not available (NO API KEY)");
      return res.status(500).json({ok: false, error: "NO API KEY"});
    }

    // appelle ton service en passant la clé
    const result = await fetchRealNewsWithAI(category, 5, forceRefresh, key);

    if (result.success) {
      return res.json({
        ok: true,
        message: result.message,
        addedCount: result.articles.length,
        articles: result.articles,
      });
    } else {
      return res.status(200).json({ok: false, message: result.message});
    }
  } catch (e) {
    console.error("Fetch AI news error:", e);
    return res.status(500).json({ok: false, error: String(e)});
  }
}
