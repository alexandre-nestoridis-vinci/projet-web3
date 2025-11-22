/**
 * Article Repository - Data access layer for articles and comments
 * Handles all Firestore operations related to articles
 */

import {articlesCol} from "../firestore";
import {Article} from "../types";

/**
 * Get articles with optional category filter
 * @param {string} category - Optional category filter
 * @param {number} limit - Maximum number of articles to fetch
 * @return {Promise<Article[]>} List of articles
 */
export async function getArticles(
  category?: string,
  limit = 20
): Promise<Article[]> {
  let query: FirebaseFirestore.Query = articlesCol
    .orderBy("publishedAt", "desc")
    .limit(limit);

  if (category) {
    query = query.where("category", "==", category);
  }

  const snap = await query.get();
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Article, "id">),
  }));
}

/**
 * Get a single article by ID
 * @param {string} articleId - Article ID
 * @return {Promise<Article | null>} Article or null if not found
 */
export async function getArticleById(
  articleId: string
): Promise<Article | null> {
  const doc = await articlesCol.doc(articleId).get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...(doc.data() as Omit<Article, "id">),
  };
}

/**
 * Create a new article
 * @param {Omit<Article, "id">} article - Article data without ID
 * @return {Promise<Article>} Created article with ID
 */
export async function createArticle(
  article: Omit<Article, "id">
): Promise<Article> {
  const docRef = await articlesCol.add({
    ...article,
    fetchedAt: new Date(),
  });

  return {
    id: docRef.id,
    ...article,
  };
}

/**
 * Check if an article exists by dedup hash
 * @param {string} dedupHash - Deduplication hash
 * @return {Promise<boolean>} True if article exists
 */
export async function articleExistsByHash(
  dedupHash: string
): Promise<boolean> {
  const existing = await articlesCol
    .where("dedupHash", "==", dedupHash)
    .limit(1)
    .get();

  return !existing.empty;
}

/**
 * Get the most recent article for a category
 * @param {string} category - Category name
 * @return {Promise<Article | null>} Most recent article or null
 */
export async function getMostRecentArticleByCategory(
  category: string
): Promise<Article | null> {
  const snapshot = await articlesCol
    .where("category", "==", category)
    .orderBy("fetchedAt", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...(doc.data() as Omit<Article, "id">),
  };
}
