// Fichier supprimé : les commentaires ne sont plus utilisés
/**
 * Comment Controller
 * Handles HTTP requests related to article comments
 */

import {Request, Response} from "express";
import {
  addComment,
  getComments,
  getArticleById,
} from "../data/articleRepository";

/**
 * POST /api/articles/:id/comments
 * Add a comment to an article
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function addCommentHandler(req: Request, res: Response) {
  const articleId = req.params.id;
  const text = String(req.body?.text || "").trim();
  const authorName = req.body?.authorName ?
    String(req.body.authorName).trim() :
    "Anonymous";

  if (!text) {
    return res.status(400).json({
      ok: false,
      error: "Comment text is required",
    });
  }

  try {
    // Check if article exists
    const article = await getArticleById(articleId);
    if (!article) {
      return res.status(404).json({
        ok: false,
        error: "Article not found",
      });
    }

    // Add comment to subcollection
    const comment = await addComment(articleId, {
      text,
      authorName: authorName || "Anonymous",
      createdAt: new Date(),
    });

    return res.json({
      ok: true,
      comment,
    });
  } catch (e: unknown) {
    console.error("Add comment error:", e);
    return res.status(500).json({
      ok: false,
      error: String(e),
    });
  }
}

/**
 * GET /api/articles/:id/comments
 * Get all comments for an article
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getCommentsHandler(req: Request, res: Response) {
  const articleId = req.params.id;

  try {
    const items = await getComments(articleId);

    res.json({
      ok: true,
      comments: items,
    });
  } catch (e) {
    console.error("Get comments error:", e);
    res.status(500).json({
      ok: false,
      error: String(e),
    });
  }
}
