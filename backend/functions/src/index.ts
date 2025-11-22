/**
 * functions/src/index.ts
 * Backend API - News Application with Comments
 * Firebase Cloud Functions Gen-2 + Express (secrets attachés)
 */

import express from "express";
import cors from "cors";
import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";

import {
  getNewsHandler,
  getArticleByIdHandler,
} from "./controllers/articleController";
import {fetchAINewsHandler} from "./controllers/aiNewsController";

const GEMINI_SECRET = defineSecret("GEMINI_API_KEY");

const app = express();
app.use(cors({origin: true})); // permissif pour tests — restreindre en prod
app.use(express.json());

// Article routes
app.get("/api/news", getNewsHandler);
app.get("/api/articles/:id", getArticleByIdHandler);

app.post("/api/fetch-ai-news", fetchAINewsHandler);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ok: true, message: "News API is running"});
});

/**
 * Export the Express app as Cloud Functions Gen-2
 * - 'api' : default region
 * - 'eurApi' : explicitly in europe-west1
 *
 * IMPORTANT: onRequest must know que la function utilise GEMINI_SECRET,
 * donc on le passe via `secrets: [GEMINI_SECRET]`.
 */
export const api = onRequest({secrets: [GEMINI_SECRET]}, app);
export const eurApi = onRequest(
  {region: "europe-west1", secrets: [GEMINI_SECRET]},
  app
);
