/**
 * AI News Fetcher Service
 * Récupère les news réelles via une IA (Gemini ou OpenAI)
 */

import axios from "axios";
import {articlesCol} from "../firestore";
import {analyzeArticle} from "./aiService";
import {Article} from "../types";
import crypto from "crypto";

// Configuration - À remplir avec ta clé API
const GEMINI_API_KEY = "";
// Plus d'utilisation d'OpenAI
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 heure

/** Structure de news brute depuis l'IA */
interface RawNewsItem {
  title: string;
  description: string;
  content: string;
  url: string;
  source: string;
}

/**
 * Récupère les news via Google Gemini (gratuit et simple)
 * @param {string} category - Catégorie des news
 * @param {number} limit - Nombre maximum de news
 * @return {Promise<RawNewsItem[]>} News récupérées
 */
async function fetchNewsWithGemini(
  category: string,
  limit = 5
): Promise<Array<{
  title: string;
  description: string;
  content: string;
  url: string;
  source: string;
}>> {
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

    if (snapshot.empty) return true; // Aucun article, on fetch

    const lastArticle = snapshot.docs[0].data();
    const lastFetch = lastArticle.fetchedAt?.toDate?.() || new Date(0);
    const now = new Date();

    // Si plus de 1h depuis le dernier fetch, on refetch
    return now.getTime() - lastFetch.getTime() > CACHE_DURATION_MS;
  } catch (e) {
    console.warn("Error checking cache:", e);
    return true; // En cas d'erreur, refetch
  }
}

/**
 * Récupère les news via IA et les stocke dans Firestore
 * @param {string} category - Catégorie des news
 * @param {number} limit - Nombre maximum de news
 * @param {boolean} forceRefresh - Forcer le refresh du cache
 * @return {Promise<Object>} Résultat de l'opération
 */
export async function fetchRealNewsWithAI(
  category: string,
  limit = 5,
  forceRefresh = false
): Promise<{success: boolean; articles: Article[]; message: string}> {
  try {
    // Vérifier le cache
    if (!forceRefresh && !(await shouldFetchNews(category))) {
      return {
        success: false,
        articles: [],
        message:
          "Les news ont déjà été récupérées il y a moins d'1h. " +
          "Réessaie plus tard.",
      };
    }

    // Récupérer via IA (Gemini uniquement)
    let newsData: RawNewsItem[] | Article[] = [];
    let source = "";

    if (GEMINI_API_KEY) {
      try {
        console.log("Fetching with Gemini...");
        newsData = await fetchNewsWithGemini(category, limit);
        source = "Gemini";
      } catch (e) {
        console.warn("Gemini failed, no data available");
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
      const url = item.url || `https://news.example.com/${crypto.randomBytes(4).toString("hex")}`;
      const itemSource = typeof item.source === "string" ?
        item.source : item.source?.name || source;

      // Créer un hash pour la déduplication
      const dedupHash = crypto
        .createHash("md5")
        .update(`${url}${title}`.substring(0, 1000))
        .digest("hex");

      // Vérifier si l'article existe déjà
      const existing = await articlesCol
        .where("dedupHash", "==", dedupHash)
        .limit(1)
        .get();

      if (!existing.empty) {
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
