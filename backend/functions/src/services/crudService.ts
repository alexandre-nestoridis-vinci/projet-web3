import * as logger from "firebase-functions/logger";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {NewsArticle, NewsCategory} from "../types/types";
import {Validator} from "../utils/validation";

/**
 * Service CRUD pour la gestion des articles et catégories
 */
export class CRUDService {
  private db = getFirestore();
  private cache = new Map<string, unknown>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // ===== GESTION DES ARTICLES =====

  /**
   * Créer un nouvel article
   * @param {Omit<NewsArticle, "id" | "createdAt" | "updatedAt">} article
   * @return {Promise<string>} ID de l'article créé
   */
  async createArticle(
    article: Omit<NewsArticle, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      // Validation
      const validation = Validator.validateArticle({
        title: article.title,
        content: article.content,
        url: article.url,
      });

      if (!validation.isValid) {
        throw new Error(
          `Validation échouée: ${validation.errors
            .map((e) => e.message)
            .join(", ")}`
        );
      }

      const now = new Date();
      const docRef = this.db.collection("articles").doc();

      const newArticle: NewsArticle = {
        ...article,
        id: docRef.id,
        createdAt: now,
        updatedAt: now,
        views: 0,
        popularity: 0,
      };

      await docRef.set(newArticle);
      this.invalidateCache(`article_${docRef.id}`);
      this.invalidateCache("articles_list");

      logger.info(`Article créé avec ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      logger.error("Erreur création article:", error);
      throw error;
    }
  }

  /**
   * Lire un article par ID
   * @param {string} id - ID de l'article
   * @return {Promise<NewsArticle | null>} Article ou null
   */
  async readArticle(id: string): Promise<NewsArticle | null> {
    try {
      const cacheKey = `article_${id}`;
      const cached = this.getFromCache<NewsArticle>(cacheKey);
      if (cached) {
        return cached;
      }

      const doc = await this.db.collection("articles").doc(id).get();
      if (!doc.exists) {
        return null;
      }

      const article = {
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data()?.publishedAt?.toDate(),
        createdAt: doc.data()?.createdAt?.toDate(),
        updatedAt: doc.data()?.updatedAt?.toDate(),
      } as NewsArticle;

      this.setCache(cacheKey, article);
      return article;
    } catch (error) {
      logger.error(`Erreur lecture article ${id}:`, error);
      return null;
    }
  }

  /**
   * Mettre à jour un article
   * @param {string} id - ID de l'article
   * @param {Partial<NewsArticle>} updates - Données à mettre à jour
   * @return {Promise<boolean>} Succès de l'opération
   */
  async updateArticle(
    id: string,
    updates: Partial<NewsArticle>
  ): Promise<boolean> {
    try {
      const docRef = this.db.collection("articles").doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error(`Article ${id} non trouvé`);
      }

      await docRef.update({
        ...updates,
        updatedAt: new Date(),
      });

      this.invalidateCache(`article_${id}`);
      this.invalidateCache("articles_list");

      logger.info(`Article ${id} mis à jour`);
      return true;
    } catch (error) {
      logger.error(`Erreur mise à jour article ${id}:`, error);
      return false;
    }
  }

  /**
   * Supprimer un article
   * @param {string} id - ID de l'article
   * @return {Promise<boolean>} Succès de l'opération
   */
  async deleteArticle(id: string): Promise<boolean> {
    try {
      const docRef = this.db.collection("articles").doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new Error(`Article ${id} non trouvé`);
      }

      await docRef.delete();
      this.invalidateCache(`article_${id}`);
      this.invalidateCache("articles_list");

      logger.info(`Article ${id} supprimé`);
      return true;
    } catch (error) {
      logger.error(`Erreur suppression article ${id}:`, error);
      return false;
    }
  }

  /**
   * Lister tous les articles avec pagination
   * @param {object} options - Options de pagination et tri
   * @return {Promise<{articles: NewsArticle[]; total: number}>}
   */
  async listArticles(options: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: "asc" | "desc";
    status?: string;
  } = {}): Promise<{ articles: NewsArticle[]; total: number }> {
    try {
      const {
        limit = 20,
        offset = 0,
        orderBy = "publishedAt",
        orderDirection = "desc",
        status = "published",
      } = options;

      const cacheKey = `articles_list_${JSON.stringify(options)}`;
      const cached = this.getFromCache<{
        articles: NewsArticle[];
        total: number;
      }>(cacheKey);
      if (cached) {
        return cached;
      }

      let query = this.db
        .collection("articles")
        .where("status", "==", status)
        .orderBy(orderBy, orderDirection);

      // Pagination
      if (offset > 0) {
        query = query.offset(offset);
      }
      query = query.limit(limit);

      const [snapshot, totalSnapshot] = await Promise.all([
        query.get(),
        this.db.collection("articles").where("status", "==", status).get(),
      ]);

      const articles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as NewsArticle[];

      const result = {
        articles,
        total: totalSnapshot.size,
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      logger.error("Erreur listage articles:", error);
      return {articles: [], total: 0};
    }
  }

  // ===== GESTION DES CATÉGORIES =====

  /**
   * Créer une nouvelle catégorie
   * @param {Omit<NewsCategory, "id">} category - Données de la catégorie
   * @return {Promise<string>} ID de la catégorie créée
   */
  async createCategory(
    category: Omit<NewsCategory, "id">
  ): Promise<string> {
    try {
      const docRef = this.db.collection("categories").doc();
      const newCategory: NewsCategory = {
        ...category,
        id: docRef.id,
      };

      await docRef.set(newCategory);
      this.invalidateCache("categories_list");

      logger.info(`Catégorie créée avec ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      logger.error("Erreur création catégorie:", error);
      throw error;
    }
  }

  /**
   * Lister toutes les catégories
   * @return {Promise<NewsCategory[]>} Liste des catégories
   */
  async listCategories(): Promise<NewsCategory[]> {
    try {
      const cached = this.getFromCache<NewsCategory[]>("categories_list");
      if (cached) {
        return cached;
      }

      const snapshot = await this.db.collection("categories").get();
      const categories = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as NewsCategory
      );

      this.setCache("categories_list", categories);
      return categories;
    } catch (error) {
      logger.error("Erreur listage catégories:", error);
      return [];
    }
  }

  /**
   * Mettre à jour une catégorie
   * @param {string} id - ID de la catégorie
   * @param {Partial<NewsCategory>} updates - Données à mettre à jour
   * @return {Promise<boolean>} Succès de l'opération
   */
  async updateCategory(
    id: string,
    updates: Partial<NewsCategory>
  ): Promise<boolean> {
    try {
      await this.db.collection("categories").doc(id).update(updates);
      this.invalidateCache("categories_list");
      logger.info(`Catégorie ${id} mise à jour`);
      return true;
    } catch (error) {
      logger.error(`Erreur mise à jour catégorie ${id}:`, error);
      return false;
    }
  }

  /**
   * Supprimer une catégorie
   * @param {string} id - ID de la catégorie
   * @return {Promise<boolean>} Succès de l'opération
   */
  async deleteCategory(id: string): Promise<boolean> {
    try {
      await this.db.collection("categories").doc(id).delete();
      this.invalidateCache("categories_list");
      logger.info(`Catégorie ${id} supprimée`);
      return true;
    } catch (error) {
      logger.error(`Erreur suppression catégorie ${id}:`, error);
      return false;
    }
  }

  // ===== RECHERCHE FULL-TEXT =====

  /**
   * Recherche full-text dans les articles
   * @param {string} query - Terme de recherche
   * @param {object} options - Options de recherche
   * @return {Promise<NewsArticle[]>} Résultats de recherche
   */
  async searchArticles(
    query: string,
    options: {
      category?: string;
      limit?: number;
      status?: string;
    } = {}
  ): Promise<NewsArticle[]> {
    try {
      const {category, limit = 20, status = "published"} = options;

      // Construction de la requête
      let firestoreQuery = this.db
        .collection("articles")
        .where("status", "==", status);

      if (category) {
        firestoreQuery = firestoreQuery.where("category.id", "==", category);
      }

      const snapshot = await firestoreQuery.limit(limit * 2).get();
      const queryLower = query.toLowerCase();

      // Filtrage côté client pour la recherche full-text
      const results = snapshot.docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
              publishedAt: doc.data().publishedAt?.toDate(),
              createdAt: doc.data().createdAt?.toDate(),
              updatedAt: doc.data().updatedAt?.toDate(),
            }) as NewsArticle
        )
        .filter((article) => {
          return (
            article.title.toLowerCase().includes(queryLower) ||
            article.summary.toLowerCase().includes(queryLower) ||
            article.content.toLowerCase().includes(queryLower) ||
            article.keywords.some((keyword) =>
              keyword.toLowerCase().includes(queryLower)
            ) ||
            article.tags.some((tag) => tag.toLowerCase().includes(queryLower))
          );
        })
        .slice(0, limit);

      logger.info(
        `Recherche "${query}" - ${results.length} résultats trouvés`
      );
      return results;
    } catch (error) {
      logger.error(`Erreur recherche "${query}":`, error);
      return [];
    }
  }

  /**
   * Incrémenter le nombre de vues d'un article
   * @param {string} id - ID de l'article
   * @return {Promise<void>}
   */
  async incrementViews(id: string): Promise<void> {
    try {
      await this.db
        .collection("articles")
        .doc(id)
        .update({
          views: FieldValue.increment(1),
        });
      this.invalidateCache(`article_${id}`);
    } catch (error) {
      logger.error(`Erreur incrément vues article ${id}:`, error);
    }
  }

  // ===== GESTION DU CACHE =====

  /**
   * Récupérer une valeur du cache
   * @param {string} key - Clé du cache
   * @return {T | null} Valeur cachée ou null
   */
  private getFromCache<T>(key: string): T | null {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return (this.cache.get(key) as T) || null;
  }

  /**
   * Stocker une valeur dans le cache
   * @param {string} key - Clé du cache
   * @param {unknown} value - Valeur à cacher
   * @return {void}
   */
  private setCache(key: string, value: unknown): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  /**
   * Invalider une entrée du cache
   * @param {string} key - Clé à invalider
   * @return {void}
   */
  private invalidateCache(key: string): void {
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
  }

  /**
   * Vider tout le cache
   * @return {void}
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    logger.info("Cache vidé");
  }
}
