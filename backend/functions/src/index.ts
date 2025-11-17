/**
 * Backend API - News Application with Comments
 * Firebase Cloud Functions + Express
 */

import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import { fetchNewsByCategory } from "./newsService";
import { fetchRealNewsWithAI } from "./aiNewsService";
import { articlesCol } from "./firestore";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

/**
 * POST /api/news/fetch
 * Fetch news by category from external sources
 */
app.post("/api/news/fetch", async (req, res) => {
  const category = String(req.body?.category || "technology");
  const limit = Number(req.body?.limit || 20);

  try {
    const added = await fetchNewsByCategory(category, limit);
    res.json({
      ok: true,
      addedCount: added.length,
      added
    });
  } catch (e) {
    console.error("Fetch error:", e);
    res.status(500).json({
      ok: false,
      error: String(e)
    });
  }
});

/**
 * GET /api/news
 * Retrieve articles, optionally filtered by category
 */
app.get("/api/news", async (req, res) => {
  const category = String(req.query.category || "").trim();
  const limit = Number(req.query.limit || 20);

  try {
    let query: FirebaseFirestore.Query = articlesCol
      .orderBy("publishedAt", "desc")
      .limit(limit);

    if (category) {
      query = query.where("category", "==", category);
    }

    const snap = await query.get();
    const list = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as any)
    }));

    res.json({
      ok: true,
      articles: list
    });
  } catch (e) {
    console.error("Get news error:", e);
    res.status(500).json({
      ok: false,
      error: String(e)
    });
  }
});

/**
 * GET /api/articles/:id
 * Get single article by ID
 */
app.get("/api/articles/:id", async (req, res) => {
  const articleId = req.params.id;

  try {
    const doc = await articlesCol.doc(articleId).get();

    if (!doc.exists) {
      return res.status(404).json({
        ok: false,
        error: "Article not found"
      });
    }

    return res.json({
      ok: true,
      article: {
        id: doc.id,
        ...(doc.data() as any)
      }
    });
  } catch (e) {
    console.error("Get article error:", e);
    return res.status(500).json({
      ok: false,
      error: String(e)
    });
  }
});

/**
 * POST /api/articles/:id/comments
 * Add a comment to an article
 */
app.post("/api/articles/:id/comments", async (req, res) => {
  const articleId = req.params.id;
  const text = String(req.body?.text || "").trim();
  const authorName = req.body?.authorName
    ? String(req.body.authorName).trim()
    : "Anonymous";

  if (!text) {
    return res.status(400).json({
      ok: false,
      error: "Comment text is required"
    });
  }

  try {
    // Check if article exists
    const articleDoc = await articlesCol.doc(articleId).get();
    if (!articleDoc.exists) {
      return res.status(404).json({
        ok: false,
        error: "Article not found"
      });
    }

    // Add comment to subcollection
    const commentsRef = articlesCol
      .doc(articleId)
      .collection("comments");
    const docRef = await commentsRef.add({
      text,
      authorName: authorName || "Anonymous",
      createdAt: new Date()
    });

    const created = (await docRef.get()).data();

    return res.json({
      ok: true,
      comment: {
        id: docRef.id,
        ...created
      }
    });
  } catch (e) {
    console.error("Add comment error:", e);
    return res.status(500).json({
      ok: false,
      error: String(e)
    });
  }
});

/**
 * GET /api/articles/:id/comments
 * Get all comments for an article
 */
app.get("/api/articles/:id/comments", async (req, res) => {
  const articleId = req.params.id;

  try {
    const commentsRef = articlesCol
      .doc(articleId)
      .collection("comments")
      .orderBy("createdAt", "asc");

    const snap = await commentsRef.get();
    const items = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as any)
    }));

    res.json({
      ok: true,
      comments: items
    });
  } catch (e) {
    console.error("Get comments error:", e);
    res.status(500).json({
      ok: false,
      error: String(e)
    });
  }
});

/**
 * POST /api/fetch-ai-news
 * Récupère les news via une IA et les stocke dans Firestore
 * Body: { category: "informatique", forceRefresh?: boolean }
 */
app.post("/api/fetch-ai-news", async (req, res) => {
  const category = String(req.body?.category || "informatique");
  const forceRefresh = Boolean(req.body?.forceRefresh || false);

  try {
    const result = await fetchRealNewsWithAI(category, 5, forceRefresh);

    if (result.success) {
      return res.json({
        ok: true,
        message: result.message,
        addedCount: result.articles.length,
        articles: result.articles
      });
    } else {
      return res.status(200).json({
        ok: false,
        message: result.message
      });
    }
  } catch (e) {
    console.error("Fetch AI news error:", e);
    return res.status(500).json({
      ok: false,
      error: String(e)
    });
  }
});

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "News API is running"
  });
});

/**
 * Export the Express app as a Cloud Function
 */
export const api = functions.https.onRequest(app);

// Region alias for europe-west1
export const eurApi = functions.https.onRequest(app);
