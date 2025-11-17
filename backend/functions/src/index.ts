/**
 * Backend API - News Application with Comments
 * Firebase Cloud Functions + Express
 */

import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import * as newsController from "./controllers/newsController";
import * as commentsController from "./controllers/commentsController";

const app = express();
app.use(cors({origin: true}));
app.use(express.json());

/**
 * GET /api/news
 * Retrieve articles, optionally filtered by category
 */
app.get("/api/news", newsController.getNews);

/**
 * GET /api/articles/:id
 * Get single article by ID
 */
app.get("/api/articles/:id", newsController.getArticleById);

/**
 * POST /api/articles/:id/comments
 * Add a comment to an article
 */
app.post("/api/articles/:id/comments", commentsController.addComment);

/**
 * GET /api/articles/:id/comments
 * Get all comments for an article
 */
app.get("/api/articles/:id/comments", commentsController.getComments);

/**
 * POST /api/fetch-ai-news
 * Récupère les news via une IA et les stocke dans Firestore
 * Body: { category: "informatique", forceRefresh?: boolean }
 */
app.post("/api/fetch-ai-news", newsController.fetchAINews);

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "News API is running",
  });
});

/**
 * Export the Express app as a Cloud Function
 */
export const api = functions.https.onRequest(app);

// Region alias for europe-west1
export const eurApi = functions.https.onRequest(app);
