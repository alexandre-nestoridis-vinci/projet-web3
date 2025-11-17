import {getFirestore, Query} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {
  NewsArticle,
  NewsRequest,
  CategoryStats,
} from "../types/types";

// Interface spécifique au repository pour les filtres étendus
/**
 * Interface pour les filtres étendus du NewsRepository
 */
export interface NewsFilter extends NewsRequest {
  searchQuery?: string;
  relevanceScore?: number;
}

/**
 * Repository pour la gestion des articles de presse
 */
export class NewsRepository {
  private db = getFirestore();

  // 📰 Récupérer des articles avec filtres
  /**
   * Get articles with optional filtering
   * @param {Partial<NewsFilter>} filter Optional filter criteria for articles
   * @return {Promise<NewsArticle[]>} Array of filtered articles
   */
  async getArticles(
    filter: Partial<NewsFilter> = {}
  ): Promise<NewsArticle[]> {
    try {
      let query: Query = this.db.collection("articles");

      // Filtres
      if (filter.category) {
        query = query.where("category", "==", filter.category);
      }

      if (filter.status) {
        query = query.where("status", "==", filter.status);
      } else {
        query = query.where("status", "==", "published");
      }

      if (filter.source) {
        query = query.where("source", "==", filter.source);
      }

      if (filter.dateFrom) {
        query = query.where("publishedAt", ">=", filter.dateFrom);
      }

      if (filter.dateTo) {
        query = query.where("publishedAt", "<=", filter.dateTo);
      }

      // Tri
      const sortBy = filter.sortBy || "publishedAt";
      const sortOrder = filter.sortOrder || "desc";
      query = query.orderBy(sortBy, sortOrder);

      // Pagination
      if (filter.offset) {
        query = query.offset(filter.offset);
      }

      const limit = filter.limit || 20;
      query = query.limit(limit);

      const snapshot = await query.get();
      const articles: NewsArticle[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        articles.push({
          id: doc.id,
          ...data,
          publishedAt: data.publishedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as NewsArticle);
      });

      return articles;
    } catch (error) {
      logger.error("Erreur lors de la récupération des articles:", error);
      throw new Error("Impossible de récupérer les articles");
    }
  }

  /**
   * Get articles by category
   * @param {string} category Article category
   * @return {Promise<NewsArticle[]>} Articles in category
   */
  async getArticlesByCategory(
    category: string
  ): Promise<NewsArticle[]> {
    try {
      const query = this.db.collection("articles")
        .where("status", "==", "published")
        .where("category.id", "==", category)
        .orderBy("publishedAt", "desc")
        .limit(50);

      const snapshot = await query.get();
      const articles: NewsArticle[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        articles.push({
          id: doc.id,
          ...data,
          publishedAt: data.publishedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as NewsArticle);
      });

      return articles;
    } catch (error) {
      logger.error(
        `Erreur récupération articles catégorie ${category}:`,
        error
      );
      return [];
    }
  }

  // 🔍 Recherche d'articles avec texte
  /**
   * Search articles by query with options
   * @param {string} query Search query string
   * @param {Partial<NewsFilter>} options Search configuration options
   * @return {Promise<NewsArticle[]>} Search results with articles
   */
  async searchArticles(
    query: string,
    options: Partial<NewsFilter> = {}
  ): Promise<NewsArticle[]> {
    try {
      // Pour une recherche simple, on récupère tous les articles
      // et on filtre côté serveur
      // Dans une vraie app, utiliser Algolia ou ElasticSearch
      // pour la performance
      const allArticles = await this.getArticles({
        ...options,
        limit: 1000, // Limite plus élevée pour la recherche
      });

      const searchTerms = query.toLowerCase().split(" ");

      return allArticles.filter((article) => {
        const searchableText = [
          article.title,
          article.summary,
          article.content,
          ...article.tags,
          ...article.keywords,
          article.source,
          article.author || "",
        ].join(" ").toLowerCase();

        return searchTerms.some((term) => searchableText.includes(term));
      });
    } catch (error) {
      logger.error("Erreur lors de la recherche d'articles:", error);
      throw new Error("Erreur de recherche");
    }
  }

  /**
   * Statistiques par catégorie
   * @return {Promise<CategoryStats[]>} Statistiques des catégories
   */
  async getCategoryStats(): Promise<CategoryStats[]> {
    try {
      const snapshot = await this.db.collection("articles")
        .where("status", "==", "published")
        .get();

      const stats = new Map<string, CategoryStats>();

      snapshot.forEach((doc) => {
        const article = doc.data() as NewsArticle;
        const categoryId = typeof article.category === "string" ?
          article.category :
          article.category.id;
        const categoryName = typeof article.category === "string" ?
          article.category :
          article.category.name;

        if (!stats.has(categoryId)) {
          stats.set(categoryId, {
            categoryId,
            categoryName,
            articleCount: 0,
            totalViews: 0,
            averagePopularity: 0,
            lastUpdated: new Date(),
          });
        }

        const stat = stats.get(categoryId);
        if (stat) {
          stat.articleCount++;
          stat.totalViews += article.views || 0;

          const articleDate = article.updatedAt || article.publishedAt;
          if (articleDate > stat.lastUpdated) {
            stat.lastUpdated = articleDate;
          }
        }
      });

      // Calculer la popularité moyenne
      stats.forEach((stat) => {
        if (stat.articleCount > 0) {
          stat.averagePopularity = stat.totalViews / stat.articleCount;
        }
      });

      return Array.from(stats.values());
    } catch (error) {
      logger.error("Erreur lors du calcul des statistiques:", error);
      throw new Error("Impossible de calculer les statistiques");
    }
  }

  // 📄 Récupérer un article par ID
  /**
   * Get article by ID
   * @param {string} id Article identifier
   * @return {Promise<NewsArticle | null>} Article or null if not found
   */
  async getArticleById(id: string): Promise<NewsArticle | null> {
    try {
      const doc = await this.db.collection("articles").doc(id).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      if (!data) {
        return null;
      }
      return {
        id: doc.id,
        ...data,
        publishedAt: data.publishedAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as NewsArticle;
    } catch (error) {
      logger.error("Erreur lors de la récupération de l'article:", error);
      throw new Error("Article introuvable");
    }
  }

  /**
   * Créer un article
   * @param {Omit<NewsArticle, "id" | "createdAt" | "updatedAt" | "views">}
   *   article Article à créer
   * @return {Promise<string>} ID de l'article créé
   */
  async createArticle(
    article: Omit<
      NewsArticle,
      "id" | "createdAt" | "updatedAt" | "views"
    >
  ): Promise<string> {
    try {
      const now = new Date();
      const docRef = await this.db.collection("articles").add({
        ...article,
        createdAt: now,
        updatedAt: now,
        views: 0,
        popularity: 0,
      });

      logger.info("Article créé avec ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      logger.error("Erreur lors de la création de l'article:", error);
      throw new Error("Impossible de créer l'article");
    }
  }

  /**
   * Mettre à jour un article
   * @param {string} id ID de l'article
   * @param {Partial<NewsArticle>} updates Données à mettre à jour
   * @return {Promise<void>}
   */
  async updateArticle(
    id: string,
    updates: Partial<NewsArticle>
  ): Promise<void> {
    try {
      await this.db.collection("articles").doc(id).update({
        ...updates,
        updatedAt: new Date(),
      });

      logger.info("Article mis à jour:", id);
    } catch (error) {
      logger.error("Erreur lors de la mise à jour de l'article:", error);
      throw new Error("Impossible de mettre à jour l'article");
    }
  }

  /**
   * Incrémenter les vues d'un article
   * @param {string} id ID de l'article
   * @return {Promise<void>}
   */
  async incrementViews(id: string): Promise<void> {
    try {
      const docRef = this.db.collection("articles").doc(id);

      await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        if (!doc.exists) {
          throw new Error("Article non trouvé");
        }

        const currentViews = doc.data()?.views || 0;
        transaction.update(docRef, {
          views: currentViews + 1,
          updatedAt: new Date(),
        });
      });
    } catch (error) {
      logger.error("Erreur lors de l'incrémentation des vues:", error);
      throw new Error("Impossible de mettre à jour les vues");
    }
  }

  /**
   * Suggestions de recherche
   * @param {string} query Requête de recherche
   * @param {number} limit Limite de suggestions
   * @return {Promise<string[]>} Liste de suggestions
   */
  async getSearchSuggestions(query: string, limit = 10): Promise<string[]> {
    try {
      // Recherche dans les titres, tags et mots-clés les plus fréquents
      const snapshot = await this.db.collection("articles")
        .where("status", "==", "published")
        .limit(100)
        .get();

      const suggestions = new Set<string>();
      const searchTerm = query.toLowerCase();

      snapshot.forEach((doc) => {
        const article = doc.data() as NewsArticle;

        // Suggestions depuis le titre
        const titleWords = article.title.toLowerCase().split(" ");
        titleWords.forEach((word) => {
          if (word.includes(searchTerm) && word.length > 2) {
            suggestions.add(word);
          }
        });

        // Suggestions depuis les tags
        article.tags?.forEach((tag) => {
          if (tag.toLowerCase().includes(searchTerm)) {
            suggestions.add(tag);
          }
        });

        // Suggestions depuis les mots-clés
        article.keywords?.forEach((keyword) => {
          if (keyword.toLowerCase().includes(searchTerm)) {
            suggestions.add(keyword);
          }
        });
      });

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      logger.error("Erreur lors de la génération de suggestions:", error);
      return [];
    }
  }

  // 🎯 Articles similaires
  /**
   * Get similar articles to given article
   * @param {string} articleId Base article ID
   * @param {number} limit Maximum number of similar articles
   * @return {Promise<NewsArticle[]>} Array of similar articles
   */
  async getSimilarArticles(
    articleId: string,
    limit = 5
  ): Promise<NewsArticle[]> {
    try {
      const article = await this.getArticleById(articleId);
      if (!article) {
        return [];
      }

      // Recherche d'articles similaires basée sur la catégorie et les tags
      const similarArticles = await this.getArticles({
        category: typeof article.category === "string" ?
          article.category : article.category.id,
        limit: limit + 1, // +1 car on va exclure l'article actuel
        sortBy: "popularity",
        sortOrder: "desc",
        status: "published",
      });

      return similarArticles
        .filter((a) => a.id !== articleId)
        .slice(0, limit);
    } catch (error) {
      logger.error("Erreur lors de la recherche d'articles similaires:", error);
      return [];
    }
  }

  /**
   * Récupère les termes de recherche populaires
   * @param {number} limit Nombre maximum de termes à retourner
   * @return {Promise<string[]>} Termes de recherche populaires
   */
  async getTrendingSearchTerms(limit = 10): Promise<string[]> {
    try {
      // Implémentation basique - à améliorer avec de vraies métriques
      const snapshot = await this.db
        .collection("articles")
        .where("status", "==", "published")
        .orderBy("views", "desc")
        .limit(50)
        .get();

      const keywords = new Map<string, number>();

      snapshot.forEach((doc) => {
        const article = doc.data() as NewsArticle;
        article.keywords?.forEach((keyword) => {
          keywords.set(keyword, (keywords.get(keyword) || 0) + 1);
        });
        article.tags?.forEach((tag) => {
          keywords.set(tag, (keywords.get(tag) || 0) + 1);
        });
      });

      return Array.from(keywords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([keyword]) => keyword);
    } catch (error) {
      logger.error(
        "Erreur lors de la récupération des termes populaires:",
        error
      );
      return [];
    }
  }

  /**
   * Enregistre une recherche pour les statistiques
   * @param {object} searchLog Données de la recherche à enregistrer
   * @return {Promise<void>}
   */
  async logSearch(searchLog: {
    query: string;
    category?: string | null;
    resultCount: number;
    userId?: string | null;
    timestamp: Date;
    ip: string;
  }): Promise<void> {
    try {
      await this.db.collection("search_logs").add({
        ...searchLog,
        createdAt: new Date(),
      });
    } catch (error) {
      logger.error("Erreur lors de l'enregistrement de recherche:", error);
    }
  }

  /**
   * Récupère les statistiques de recherche
   * @return {Promise<object>} Statistiques de recherche
   */
  async getSearchStats(): Promise<{
    totalSearches: number;
    uniqueQueries: number;
    topQueries: [string, number][];
    searchesByDay: [string, number][];
  }> {
    try {
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const snapshot = await this.db
        .collection("search_logs")
        .where("timestamp", ">=", last7Days)
        .get();

      const stats = {
        totalSearches: snapshot.size,
        uniqueQueries: new Set<string>(),
        topQueries: new Map<string, number>(),
        searchesByDay: new Map<string, number>(),
      };

      snapshot.forEach((doc) => {
        const log = doc.data();
        stats.uniqueQueries.add(log.query);
        stats.topQueries.set(
          log.query,
          (stats.topQueries.get(log.query) || 0) + 1
        );

        const day = log.timestamp.toDate()
          .toISOString().split("T")[0];
        stats.searchesByDay.set(day, (stats.searchesByDay.get(day) || 0) + 1);
      });

      return {
        totalSearches: stats.totalSearches,
        uniqueQueries: stats.uniqueQueries.size,
        topQueries: Array.from(stats.topQueries.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10),
        searchesByDay: Array.from(stats.searchesByDay.entries())
          .sort((a, b) => a[0].localeCompare(b[0])),
      };
    } catch (error) {
      logger.error("Erreur lors de la récupération des statistiques:", error);
      return {
        totalSearches: 0,
        uniqueQueries: 0,
        topQueries: [],
        searchesByDay: [],
      };
    }
  }
}
