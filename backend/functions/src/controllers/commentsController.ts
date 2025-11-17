/**
 * Comments Controller
 * Gère les endpoints HTTP pour les commentaires
 */

import {Request, Response} from "express";
import * as newsRepository from "../data/newsRepository";

/**
 * POST /api/articles/:id/comments
 * Ajoute un commentaire à un article
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function addComment(req: Request, res: Response) {
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
    // Vérifier si l'article existe
    const articleExists = await newsRepository.articleExists(articleId);
    if (!articleExists) {
      return res.status(404).json({
        ok: false,
        error: "Article not found",
      });
    }

    // Ajouter le commentaire
    const comment = await newsRepository.addComment(
      articleId,
      text,
      authorName
    );

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
 * Récupère tous les commentaires d'un article
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export async function getComments(req: Request, res: Response) {
  const articleId = req.params.id;

  try {
    const comments = await newsRepository.getComments(articleId);

    res.json({
      ok: true,
      comments,
    });
  } catch (e) {
    console.error("Get comments error:", e);
    res.status(500).json({
      ok: false,
      error: String(e),
    });
  }
}
