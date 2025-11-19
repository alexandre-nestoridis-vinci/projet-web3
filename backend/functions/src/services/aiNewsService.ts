/**
 * AI News Fetcher Service
 * Fetches real news via AI (Gemini or OpenAI)
 */

import axios from "axios";
import crypto from "crypto";
import {Article} from "../types";
import {analyzeArticle} from "./aiService";
import {
  createArticle,
  articleExistsByHash,
  getMostRecentArticleByCategory,
} from "../data/articleRepository";

// Configuration - To be filled with API keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/** Raw news item structure from AI */
interface RawNewsItem {
  title: string;
  description: string;
  content: string;
  url: string;
  source: string;
}

/**
 * Fetch news via Google Gemini (free and simple)
 * @param {string} category - News category
 * @param {number} limit - Maximum number of news items
 * @return {Promise<RawNewsItem[]>} Fetched news
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
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Invalid response format");

    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Gemini API error:", e);
    throw e;
  }
}

/**
 * Fetch news via OpenAI (better quality)
 * @param {string} category - News category
 * @param {number} limit - Maximum number of news items
 * @return {Promise<RawNewsItem[]>} Fetched news
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
 * Check if news should be fetched (1h cache)
 * @param {string} category - Category to check
 * @return {Promise<boolean>} True if fetch is needed
 */
async function shouldFetchNews(category: string): Promise<boolean> {
  try {
    const lastArticle = await getMostRecentArticleByCategory(category);

    if (!lastArticle) return true; // No articles, fetch

    const lastFetch = lastArticle.fetchedAt ?
      new Date(lastArticle.fetchedAt) : new Date(0);
    const now = new Date();

    // If more than 1h since last fetch, refetch
    return now.getTime() - lastFetch.getTime() > CACHE_DURATION_MS;
  } catch (e) {
    console.warn("Error checking cache:", e);
    return true; // On error, refetch
  }
}

/**
 * Fetch news via AI and store in Firestore
 * @param {string} category - News category
 * @param {number} limit - Maximum number of news items
 * @param {boolean} forceRefresh - Force cache refresh
 * @return {Promise<Object>} Operation result
 */
export async function fetchRealNewsWithAI(
  category: string,
  limit = 5,
  forceRefresh = false
): Promise<{success: boolean; articles: Article[]; message: string}> {
  try {
    // Check cache
    if (!forceRefresh && !(await shouldFetchNews(category))) {
      return {
        success: false,
        articles: [],
        message:
          "Les news ont déjà été récupérées il y a moins d'1h. " +
          "Réessaie plus tard.",
      };
    }

    // Fetch via AI (Gemini, fallback OpenAI, no data)
    let newsData: RawNewsItem[] = [];
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

      // Create hash for deduplication
      const dedupHash = crypto
        .createHash("md5")
        .update(`${url}${title}`.substring(0, 1000))
        .digest("hex");

      // Check if article already exists
      if (await articleExistsByHash(dedupHash)) {
        console.log(`Article already exists: ${title}`);
        continue;
      }

      // Analyze the article
      const article: Omit<Article, "id"> = {
        title,
        description,
        content,
        url,
        source: {name: itemSource, url: ""},
        publishedAt: new Date(),
        category: category.toLowerCase(),
        dedupHash,
        fetchedAt: new Date(),
      };

      try {
        const analysis = await analyzeArticle(article as Article);
        article.summary = analysis.summary;
        article.sentiment = analysis.sentiment;
        article.keywords = analysis.keywords;
      } catch (e) {
        console.warn("AI analysis failed:", e);
      }

      // Save to Firestore
      const createdArticle = await createArticle(article);
      addedArticles.push(createdArticle);
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
