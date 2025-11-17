/**
 * News Service - Fetches news from free sources
 * Uses mock data or simple parsing as fallback
 */

import crypto from "crypto";
import {articlesCol} from "./firestore";
import {analyzeArticle} from "./aiService";
import {Article} from "./types";

/**
 * Mock news data for development
 * Replace with real API when available
 */
const mockNewsByCategory: Record<string, any[]> = {
  technology: [
    {
      title: "La révolution de l'IA transforme l'industrie tech",
      description: "Les derniers développements en intelligence artificielle changent la façon dont les entreprises opèrent",
      content: "Les modèles de langue géante comme GPT-4 révolutionnent le développement logiciel. Les entreprises investissent massivement dans l'IA...",
      url: "https://example.com/tech-ai-revolution",
      source: {name: "Tech News Daily", url: "https://technewsdaily.example.com"},
      publishedAt: new Date(),
    },
    {
      title: "Nouvelle génération de puces informatiques lancée",
      description: "Les fabricants annoncent des puces plus rapides et économes en énergie",
      content: "Les nouvelles architectures de processeurs promettent une augmentation de 40% des performances tout en réduisant la consommation énergétique de 30%...",
      url: "https://example.com/new-chips",
      source: {name: "Tech News Daily", url: "https://technewsdaily.example.com"},
      publishedAt: new Date(),
    },
  ],
  sport: [
    {
      title: "Victoire spectaculaire en Ligue 1",
      description: "Un match mémorable se termine par une victoire 3-2 face aux rivaux",
      content: "Le match de Ligue 1 d'aujourd'hui a livré un spectacle incroyable avec des buts en succession rapide et des retournements de situation dramatiques...",
      url: "https://example.com/sport-ligue1",
      source: {name: "Sports Daily", url: "https://sportsdaily.example.com"},
      publishedAt: new Date(),
    },
  ],
  politique: [
    {
      title: "Nouvelle législation adoptée par le Parlement",
      description: "Une loi majeure concernant la réforme fiscale est approuvée",
      content: "Le Parlement a voté en faveur d'une réforme fiscale complète après des débats intenses. Cette législation affectera millions de citoyens...",
      url: "https://example.com/politics-law",
      source: {name: "Politics Today", url: "https://politicstoday.example.com"},
      publishedAt: new Date(),
    },
  ],
  economie: [
    {
      title: "Les marchés réagissent aux nouveaux chiffres de l'inflation",
      description: "Les indices boursiers montent sur les perspectives d'une baisse des taux d'intérêt",
      content: "Les marchés financiers mondiaux réagissent positivement aux derniers chiffres d'inflation qui sont plus faibles que prévu. Cela augmente les attentes...",
      url: "https://example.com/economy-market",
      source: {name: "Finance News", url: "https://financenews.example.com"},
      publishedAt: new Date(),
    },
  ],
};

/**
 * Fetch news by category
 * Currently uses mock data; can be extended with real API
 */
export async function fetchNewsByCategory(
  category: string,
  limit = 20
): Promise<Article[]> {
  let items = mockNewsByCategory[category.toLowerCase()] || [];

  if (items.length === 0) {
    // Fallback to technology if category not found
    items = mockNewsByCategory.technology || [];
  }

  const processed: Article[] = [];

  for (const it of items.slice(0, limit)) {
    const url = it.url || "";
    const title = it.title || "Untitled";
    const description = it.description || "";
    const content = it.content || description;
    const publishedAt = it.publishedAt || new Date();
    const dedupHash = crypto
      .createHash("md5")
      .update(`${url}${title}`.substring(0, 1000))
      .digest("hex");

    // Check for duplicates
    const existing = await articlesCol
      .where("dedupHash", "==", dedupHash)
      .limit(1)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0];
      await doc.ref.update({fetchedAt: new Date()});
      continue;
    }

    const article: Article = {
      title,
      description,
      content,
      url,
      source: it.source || {name: "Unknown", url: ""},
      publishedAt,
      category: category.toLowerCase(),
      dedupHash,
    };

    // Analyze with AI (simple heuristics)
    try {
      const analysis = await analyzeArticle(article);
      article.summary = analysis.summary;
      article.sentiment = analysis.sentiment;
      article.keywords = analysis.keywords;
    } catch (e) {
      console.error("AI analysis failed:", e);
    }

    // Save to Firestore
    const docRef = await articlesCol.add({
      ...article,
      fetchedAt: new Date(),
    });
    article.id = docRef.id;
    processed.push(article);
  }

  return processed;
}
