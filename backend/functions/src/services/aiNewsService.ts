/**
 * AI News Fetcher Service
 * Récupère les news réelles via une IA (Gemini)
 */

import axios from "axios";
import {articlesCol} from "../firestore";
import {analyzeArticle} from "./aiService";
import {Article} from "../types";
import crypto from "crypto";

// Cache durée en ms (1 heure)
const CACHE_DURATION_MS = 60 * 60 * 1000;

/** Structure de news brute depuis l'IA */
interface RawNewsItem {
  title: string;
  description: string;
  content: string;
  url: string;
  source: string;
}

/**
 * Récupère les news via Google Gemini
 * @param {string} category - Catégorie des news
 * @param {number} limit - Nombre maximum de news
 * @param {string} geminiApiKey - Clé API Gemini
 * @return {Promise<RawNewsItem[]>} - Liste des news brutes
 */
async function fetchNewsWithGemini(
  category: string,
  limit: number,
  geminiApiKey: string
): Promise<RawNewsItem[]> {
  if (!geminiApiKey) {
    throw new Error("GEMINI API key not provided");
  }

  const prompt = `Donne-moi ${limit} actualités récentes du ` +
    `domaine "${category}" en français.\n` +
    "Format JSON exact:\n" +
    "[\n  {\n    \"title\": \"Titre de l'actualité\",\n" +
    "    \"description\": \"Description courte\",\n" +
    "    \"content\": \"Contenu détaillé de l'article\",\n" +
    "    \"url\": \"https://example.com\",\n" +
    "    \"source\": \"Nom de la source\"\n  }\n]\n" +
    "UNIQUEMENT du JSON valide, aucun autre texte.";

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    `gemini-2.5-flash:generateContent?key=${encodeURIComponent(
      geminiApiKey
    )}`;

  try {
    const response = await axios.post(
      url,
      {contents: [{parts: [{text: prompt}]}]},
      {timeout: 30000}
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error(
        "Gemini returned unexpected text (truncated):",
        text.substring(0, 200)
      );
      throw new Error("Invalid response format from Gemini");
    }

    return JSON.parse(jsonMatch[0]) as RawNewsItem[];
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

/**
 * Vérifie si on doit récupérer les news (cache 1h)
 * @param {string} category - Catégorie à vérifier
 * @return {Promise<boolean>} True si fetch nécessaire
 */
async function shouldFetchNews(category: string): Promise<boolean> {
  try {
    const snapshot = await articlesCol
      .where("category", "==", category)
      .orderBy("fetchedAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) return true;

    const lastArticle = snapshot.docs[0].data();
    const lastFetch = lastArticle.fetchedAt?.toDate?.() || new Date(0);

    return Date.now() - lastFetch.getTime() > CACHE_DURATION_MS;
  } catch (error) {
    console.warn("Error checking cache:", error);
    return true;
  }
}

// eslint-disable-next-line valid-jsdoc
/**
 * Récupère les news via IA et les stocke dans Firestore
 * @param {string} category - Catégorie des news
 * @param {number} [limit=5] - Nombre maximum de news
 * @param {boolean} [forceRefresh=false] - Forcer le refresh du cache
 * @param {string} [geminiApiKey] - Clé API Gemini (optionnelle)
 * @return {{
 *   success: boolean;
 *   articles: Article[];
 *   message: string;
 * }} Résultat de l'opération
 */
export async function fetchRealNewsWithAI(
  category: string,
  limit = 5,
  forceRefresh = false,
  geminiApiKey?: string
): Promise<{ success: boolean; articles: Article[]; message: string }> {
  try {
    if (!forceRefresh && !(await shouldFetchNews(category))) {
      return {
        success: false,
        articles: [],
        message:
          "Les news ont déjà été récupérées il y a moins d'1h. " +
          "Réessaie plus tard.",
      };
    }

    let newsData: RawNewsItem[] = [];
    let source = "No Data";

    if (geminiApiKey) {
      try {
        newsData = await fetchNewsWithGemini(category, limit, geminiApiKey);
        source = "Gemini";
      } catch (e) {
        console.warn("Gemini fetch failed, no data available", e);
        newsData = [];
      }
    } else {
      console.warn("No GEMINI API key provided, skipping AI fetch");
    }

    const addedArticles: Article[] = [];

    for (const item of newsData) {
      const title = item.title || "Untitled";
      const description = item.description || "";
      const content = item.content || description;
      const url =
        item.url ||
        `https://news.example.com/${crypto.randomBytes(4).toString("hex")}`;
      const itemSource =
        typeof item.source === "string" ?
          item.source : item.source;

      const dedupHash = crypto
        .createHash("md5")
        .update(`${url}${title}`.substring(0, 1000))
        .digest("hex");

      const existing = await articlesCol
        .where("dedupHash", "==", dedupHash)
        .limit(1)
        .get();

      if (!existing.empty) {
        console.log(`Article déjà existant: ${title}`);
        continue;
      }

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

      const docRef = await articlesCol.add({
        ...article,
        fetchedAt: new Date(),
        source: {name: itemSource, url: ""},
      });

      article.id = docRef.id;
      addedArticles.push(article);
    }

    return {
      success: true,
      articles: addedArticles,
      message: `${addedArticles.length} nouvelle(s) news ajoutée(s) pour ` +
        `"${category}" (source: ${source})`,
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
