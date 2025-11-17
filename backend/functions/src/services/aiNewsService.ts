/**
 * AI News Fetcher Service
 * Récupère les news réelles via une IA (Gemini ou OpenAI)
 */

import axios from "axios";
import {analyzeArticle} from "./aiService";
import {Article, RawNewsItem, FetchNewsResult} from "../types";
import * as newsRepository from "../data/newsRepository";
import crypto from "crypto";

// Configuration - À remplir avec ta clé API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 heure

/**
 * Récupère les news via Google Gemini (gratuit et simple)
 * @param {string} category - Catégorie des news
 * @param {number} limit - Nombre maximum de news
 * @return {Promise<RawNewsItem[]>} News récupérées
 */
async function fetchNewsWithGemini(
  category: string,
  limit = 5
): Promise<RawNewsItem[]> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const prompt = `Donne-moi ${limit} actualités récentes du ` +
    `domaine "${category}" en français.
Format JSON exact:
[
  {
    "title": "Titre de l'actualité",
    "description": "Description courte",
    "content": "Contenu détaillé de l'article",
    "url": "https://example.com",
    "source": "Nom de la source"
  }
]
UNIQUEMENT du JSON valide, aucun autre texte.`;

  try {
    console.log(`Calling Gemini API for category: ${category}`);
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      `gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await axios.post(
      url,
      {
        contents: [{
          parts: [{text: prompt}],
        }],
      },
      {timeout: 30000}
    );

    console.log("Gemini response received!");
    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("Gemini response text:", text.substring(0, 200));
    // Extraire le JSON de la réponse
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Invalid response format");

    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Gemini API error:", e);
    throw e;
  }
}

/**
 * Récupère les news via OpenAI (meilleure qualité)
 * @param {string} category - Catégorie des news
 * @param {number} limit - Nombre maximum de news
 * @return {Promise<RawNewsItem[]>} News récupérées
 */
async function fetchNewsWithOpenAI(
  category: string,
  limit = 5
): Promise<RawNewsItem[]> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const prompt = `Donne-moi ${limit} actualités récentes du ` +
    `domaine "${category}" en français.
Format JSON exact:
[
  {
    "title": "Titre de l'actualité",
    "description": "Description courte",
    "content": "Contenu détaillé de l'article",
    "url": "https://example.com",
    "source": "Nom de la source"
  }
]
UNIQUEMENT du JSON valide, aucun autre texte.`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{role: "user", content: prompt}],
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {Authorization: `Bearer ${OPENAI_API_KEY}`},
        timeout: 15000,
      }
    );

    const text = response.data?.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Invalid response format");

    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("OpenAI API error:", e);
    throw e;
  }
}

/**
 * Récupère les news via IA et les stocke dans Firestore
 * @param {string} category - Catégorie des news
 * @param {number} limit - Nombre maximum de news
 * @param {boolean} forceRefresh - Forcer le refresh du cache
 * @return {Promise<FetchNewsResult>} Résultat de l'opération
 */
export async function fetchRealNewsWithAI(
  category: string,
  limit = 5,
  forceRefresh = false
): Promise<FetchNewsResult> {
  try {
    // Vérifier le cache
    if (!forceRefresh && !(await newsRepository.shouldRefreshNews(
      category,
      CACHE_DURATION_MS
    ))) {
      return {
        success: false,
        articles: [],
        message:
          "Les news ont déjà été récupérées il y a moins d'1h. " +
          "Réessaie plus tard.",
      };
    }

    // Récupérer via IA (Gemini, fallback OpenAI, mock data)
    let newsData: RawNewsItem[];
    let source = "";

    if (GEMINI_API_KEY) {
      try {
        console.log("Fetching with Gemini...");
        newsData = await fetchNewsWithGemini(category, limit);
        source = "Gemini";
      } catch (e) {
        console.warn("Gemini failed, trying OpenAI...");
        if (OPENAI_API_KEY) {
          try {
            console.log("Fetching with OpenAI...");
            newsData = await fetchNewsWithOpenAI(category, limit);
            source = "OpenAI";
          } catch (e2) {
            console.warn("OpenAI failed, no data available");
            newsData = [];
            source = "No Data";
          }
        } else {
          console.warn("No OpenAI key, no data available");
          newsData = [];
          source = "No Data";
        }
      }
    } else if (OPENAI_API_KEY) {
      try {
        console.log("Fetching with OpenAI...");
        newsData = await fetchNewsWithOpenAI(category, limit);
        source = "OpenAI";
      } catch (e) {
        console.warn("OpenAI failed, no data available");
        newsData = [];
        source = "No Data";
      }
    } else {
      console.warn("No AI API keys available, no data");
      newsData = [];
      source = "No Data";
    }

    const addedArticles: Article[] = [];

    for (const item of newsData) {
      const title = item.title || "Untitled";
      const description = item.description || "";
      const content = item.content || description;
      const url = item.url ||
        `https://news.example.com/${crypto.randomBytes(4).toString("hex")}`;
      const itemSource = typeof item.source === "string" ?
        item.source : source;

      // Créer un hash pour la déduplication
      const dedupHash = crypto
        .createHash("md5")
        .update(`${url}${title}`.substring(0, 1000))
        .digest("hex");

      // Vérifier si l'article existe déjà
      const exists = await newsRepository.articleExistsByHash(dedupHash);

      if (exists) {
        console.log(`Article déjà existant: ${title}`);
        continue;
      }

      // Analyser l'article
      const article: Article = {
        title,
        description,
        content,
        url,
        source: {name: itemSource, url: ""},
        publishedAt: new Date(),
        category: category.toLowerCase(),
        dedupHash,
      };

      try {
        const analysis = await analyzeArticle(article);
        article.summary = analysis.summary;
        article.sentiment = analysis.sentiment;
        article.keywords = analysis.keywords;
      } catch (e) {
        console.warn("AI analysis failed:", e);
      }

      // Sauvegarder dans Firestore
      const docId = await newsRepository.addArticle(article);
      article.id = docId;
      addedArticles.push(article);
    }

    return {
      success: true,
      articles: addedArticles,
      message:
        `${addedArticles.length} nouvelle(s) news ` +
        `ajoutée(s) pour "${category}" (source: ${source})`,
    };
  } catch (e) {
    console.error("Error fetching news with AI:", e);
    return {
      success: false,
      articles: [],
      message: `Erreur: ${String(e)}`,
    };
  }
}
