/**
 * Backend API - News Application with Comments
 * Firebase Cloud Functions + Express
 */

import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import {
  getNewsHandler,
  getArticleByIdHandler,
} from "./controllers/articleController";
import {fetchAINewsHandler} from "./controllers/aiNewsController";

const app = express();
app.use(cors({origin: true}));
app.use(express.json());

// Article routes
app.get("/api/news", getNewsHandler);
app.get("/api/articles/:id", getArticleByIdHandler);

// Comment routes

// AI News routes
app.post("/api/fetch-ai-news", fetchAINewsHandler);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "News API is running",
  });
});

// API pour traitement IA
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
    message: "API IA - À implémenter",
    status: "TODO",
  });
});
