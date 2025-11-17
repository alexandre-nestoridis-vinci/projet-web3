import * as logger from "firebase-functions/logger";
import {getFirestore} from "firebase-admin/firestore";
import axios from "axios";
import Parser from "rss-parser";
import {NewsArticle, NewsCategory} from "../types/types";
import {AIService} from "./aiService";

/**
 * Service de récupération et gestion des actualités
 */
export class NewsService {
  private db = getFirestore();
  private rssParser = new Parser();
  private aiService = new AIService();

  // Configuration des sources RSS françaises
  private rssSources = [
    {
      name: "Le Monde",
      url: "https://www.lemonde.fr/rss/une.xml",
      category: "general",
      reliability: 0.9,
    },
    {
      name: "Le Figaro",
      url: "https://www.lefigaro.fr/rss/figaro_une.xml",
      category: "general",
      reliability: 0.85,
    },
    {
      name: "Les Échos",
      url: "https://www.lesechos.fr/rss.xml",
      category: "business",
      reliability: 0.88,
    },
  ];

  /**
   * Récupération des actualités via NewsAPI
   * @param {string} category - Catégorie d'actualités
   * @param {string} country - Code pays (fr par défaut)
   * @param {number} pageSize - Nombre d'articles
   * @return {Promise<NewsArticle[]>} Articles récupérés
   */
  async fetchFromNewsAPI(
    category = "general",
    country = "fr",
    pageSize = 20
  ): Promise<NewsArticle[]> {
    try {
      const apiKey = process.env.NEWSAPI_KEY;
      if (!apiKey) {
        throw new Error("NewsAPI key not configured");
      }

      const response = await axios.get(
        "https://newsapi.org/v2/top-headlines",
        {
          params: {
            country,
            category,
            pageSize,
            apiKey,
          },
        }
      );

      const articles = await Promise.all(
        response.data.articles.map((article: unknown) =>
          this.processRawArticle(article, "newsapi")
        )
      );

      logger.info(
        `Récupéré ${articles.length} articles de NewsAPI pour ${category}`
      );
      return articles;
    } catch (error) {
      logger.error("Erreur NewsAPI:", error);
      return [];
    }
  }

  /**
   * Récupération des actualités via flux RSS
   * @return {Promise<NewsArticle[]>} Articles des flux RSS
   */
  async fetchFromRSS(): Promise<NewsArticle[]> {
    const allArticles: NewsArticle[] = [];

    for (const source of this.rssSources) {
      try {
        const feed = await this.rssParser.parseURL(source.url);
        const articles = await Promise.all(
          feed.items.slice(0, 10).map((item: unknown) =>
            this.processRSSItem(item, source)
          )
        );
        allArticles.push(...articles);
        logger.info(
          `Récupéré ${articles.length} articles de ${source.name}`
        );
      } catch (error) {
        logger.error(`Erreur RSS ${source.name}:`, error);
      }
    }

    return allArticles;
  }

  /**
   * Traitement d'un article brut en NewsArticle
   * @param {unknown} rawArticle - Article brut
   * @param {string} sourceType - Type de source
   * @return {Promise<NewsArticle>} Article traité
   */
  private async processRawArticle(
    rawArticle: unknown,
    sourceType: string
  ): Promise<NewsArticle> {
    const article = rawArticle as Record<string, unknown>;

    // Structure de base
    const newsArticle: Omit<NewsArticle, "id"> = {
      title: (article.title as string) || "Sans titre",
      summary: (article.description as string) || "",
      content: (article.content as string) ||
               (article.description as string) || "",
      category: await this.determineCategory(article.title as string),
      source: (article.source as Record<string, unknown>)?.name as string ||
              sourceType,
      author: (article.author as string) || undefined,
      url: (article.url as string) || "",
      publishedAt: new Date(article.publishedAt as string),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "published" as const,
      aiGenerated: false,
      imageUrl: (article.urlToImage as string) || undefined,
      tags: [],
      keywords: [],
      views: 0,
      popularity: 0,
    };

    // Analyse IA automatique
    try {
      const aiAnalysis = await this.aiService.analyzeArticle({
        articleId: "",
        title: newsArticle.title,
        content: newsArticle.content,
      });

      newsArticle.sentiment = aiAnalysis.sentiment;
      newsArticle.keywords = aiAnalysis.keywords;
    } catch (error) {
      logger.error("Erreur analyse IA:", error);
    }

    return newsArticle as NewsArticle;
  }

  /**
   * Traitement d'un item RSS
   * @param {unknown} item - Item RSS
   * @param {object} source - Source RSS
   * @return {Promise<NewsArticle>} Article traité
   */
  private async processRSSItem(
    item: unknown,
    source: {
      name: string;
      category: string;
      reliability: number;
    }
  ): Promise<NewsArticle> {
    const rssItem = item as Record<string, unknown>;

    const newsArticle: Omit<NewsArticle, "id"> = {
      title: (rssItem.title as string) || "Sans titre",
      summary: this.extractSummary(rssItem.contentSnippet as string),
      content: (rssItem.content as string) ||
               (rssItem.contentSnippet as string) || "",
      category: await this.determineCategory(rssItem.title as string),
      source: source.name,
      url: (rssItem.link as string) || "",
      publishedAt: new Date(rssItem.pubDate as string),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "published" as const,
      aiGenerated: false,
      tags: (rssItem.categories as string[]) || [],
      keywords: [],
      views: 0,
      popularity: source.reliability,
    };

    return newsArticle as NewsArticle;
  }

  /**
   * Déduplication des articles similaires
   * @param {NewsArticle[]} articles - Articles à dédupliquer
   * @return {Promise<NewsArticle[]>} Articles sans doublons
   */
  async deduplicateArticles(
    articles: NewsArticle[]
  ): Promise<NewsArticle[]> {
    const unique = new Map<string, NewsArticle>();

    for (const article of articles) {
      // Création d'une clé unique basée sur le titre normalisé
      const normalizedTitle = this.normalizeTitle(article.title);
      const key = `${normalizedTitle}_${article.source}`;

      if (!unique.has(key)) {
        unique.set(key, article);
      } else {
        // Garder l'article avec la meilleure popularité
        const existing = unique.get(key)!;
        if (article.popularity > existing.popularity) {
          unique.set(key, article);
        }
      }
    }

    return Array.from(unique.values());
  }

  /**
   * Planification automatique de récupération (cron job)
   * @return {Promise<void>}
   */
  async scheduleNewsUpdate(): Promise<void> {
    try {
      logger.info("Démarrage de la mise à jour automatique des actualités");

      // Récupération de toutes les sources
      const [newsApiArticles, rssArticles] = await Promise.all([
        this.fetchFromNewsAPI(),
        this.fetchFromRSS(),
      ]);

      // Combinaison et déduplication
      const allArticles = [...newsApiArticles, ...rssArticles];
      const uniqueArticles = await this.deduplicateArticles(allArticles);

      // Sauvegarde en base
      const batch = this.db.batch();
      for (const article of uniqueArticles) {
        const docRef = this.db.collection("articles").doc();
        batch.set(docRef, {
          ...article,
          id: docRef.id,
        });
      }

      await batch.commit();
      logger.info(
        `Sauvegardé ${uniqueArticles.length} nouveaux articles`
      );
    } catch (error) {
      logger.error("Erreur lors de la mise à jour automatique:", error);
    }
  }

  /**
   * Détermination automatique de la catégorie
   * @param {string} title - Titre de l'article
   * @return {Promise<NewsCategory>} Catégorie déterminée
   */
  private async determineCategory(title: string): Promise<NewsCategory> {
    // Mots-clés par catégorie
    const categoryKeywords = {
      technology: ["tech", "digital", "intelligence artificielle", "startup"],
      sports: ["foot", "tennis", "sport", "match", "championnat"],
      politics: ["gouvernement", "politique", "élection", "député"],
      business: ["économie", "bourse", "entreprise", "finance"],
      health: ["santé", "médical", "hôpital", "maladie"],
      science: ["recherche", "étude", "scientifique", "découverte"],
    };

    const titleLower = title.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => titleLower.includes(keyword))) {
        return {
          id: category,
          name: category,
          displayName: this.getCategoryDisplayName(category),
          color: this.getCategoryColor(category),
          icon: this.getCategoryIcon(category),
        };
      }
    }

    // Catégorie par défaut
    return {
      id: "general",
      name: "general",
      displayName: "Général",
      color: "#64748b",
      icon: "newspaper",
    };
  }

  /**
   * Extraction du résumé depuis le contenu
   * @param {string} content - Contenu complet
   * @return {string} Résumé extrait
   */
  private extractSummary(content: string): string {
    if (!content) return "";
    const sentences = content.split(". ");
    return sentences.slice(0, 2).join(". ") + (sentences.length > 2 ? "." : "");
  }

  /**
   * Normalisation du titre pour déduplication
   * @param {string} title - Titre à normaliser
   * @return {string} Titre normalisé
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Nom d'affichage pour une catégorie
   * @param {string} category - ID de la catégorie
   * @return {string} Nom d'affichage
   */
  private getCategoryDisplayName(category: string): string {
    const names: Record<string, string> = {
      technology: "Technologie",
      sports: "Sport",
      politics: "Politique",
      business: "Économie",
      health: "Santé",
      science: "Sciences",
      general: "Général",
    };
    return names[category] || "Général";
  }

  /**
   * Couleur pour une catégorie
   * @param {string} category - ID de la catégorie
   * @return {string} Code couleur
   */
  private getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      technology: "#3b82f6",
      sports: "#ef4444",
      politics: "#8b5cf6",
      business: "#f59e0b",
      health: "#10b981",
      science: "#06b6d4",
      general: "#64748b",
    };
    return colors[category] || "#64748b";
  }

  /**
   * Icône pour une catégorie
   * @param {string} category - ID de la catégorie
   * @return {string} Nom de l'icône
   */
  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      technology: "laptop",
      sports: "trophy",
      politics: "government",
      business: "briefcase",
      health: "heart",
      science: "flask",
      general: "newspaper",
    };
    return icons[category] || "newspaper";
  }
}
