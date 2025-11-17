/**
 * News Repository
 * Gère l'accès aux données Firestore pour les articles et commentaires
 */

import {articlesCol} from "../services/firestore";
import {Article, Comment} from "../types";

/**
 * Récupère les articles, optionnellement filtrés par catégorie
 * @param {string} category - Catégorie de filtrage (optionnel)
 * @param {number} limit - Nombre maximum d'articles à retourner
 * @return {Promise<Article[]>} Liste des articles
 */
export async function getArticles(
  category: string,
  limit: number
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
 * Récupère un article par son ID
 * @param {string} articleId - ID de l'article
 * @return {Promise<Article | null>} Article ou null si non trouvé
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
 * Vérifie si un article existe
 * @param {string} articleId - ID de l'article
 * @return {Promise<boolean>} True si l'article existe
 */
export async function articleExists(articleId: string): Promise<boolean> {
  const doc = await articlesCol.doc(articleId).get();
  return doc.exists;
}

/**
 * Ajoute un commentaire à un article
 * @param {string} articleId - ID de l'article
 * @param {string} text - Texte du commentaire
 * @param {string} authorName - Nom de l'auteur
 * @return {Promise<Comment>} Commentaire créé
 */
export async function addComment(
  articleId: string,
  text: string,
  authorName: string
): Promise<Comment> {
  const commentsRef = articlesCol
    .doc(articleId)
    .collection("comments");

  const docRef = await commentsRef.add({
    text,
    authorName: authorName || "Anonymous",
    createdAt: new Date(),
  });

  const created = (await docRef.get()).data();

  return {
    id: docRef.id,
    ...(created as Omit<Comment, "id">),
  };
}

/**
 * Récupère tous les commentaires d'un article
 * @param {string} articleId - ID de l'article
 * @return {Promise<Comment[]>} Liste des commentaires
 */
export async function getComments(articleId: string): Promise<Comment[]> {
  const commentsRef = articlesCol
    .doc(articleId)
    .collection("comments")
    .orderBy("createdAt", "asc");

  const snap = await commentsRef.get();
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Comment, "id">),
  }));
}

/**
 * Vérifie si un article existe déjà avec le même hash
 * @param {string} dedupHash - Hash de déduplication
 * @return {Promise<boolean>} True si l'article existe
 */
export async function articleExistsByHash(
  dedupHash: string
): Promise<boolean> {
  const snap = await articlesCol
    .where("dedupHash", "==", dedupHash)
    .limit(1)
    .get();

  return !snap.empty;
}

/**
 * Ajoute un nouvel article
 * @param {Article} article - Article à ajouter
 * @return {Promise<string>} ID de l'article créé
 */
export async function addArticle(article: Article): Promise<string> {
  const docRef = await articlesCol.add({
    ...article,
    fetchedAt: new Date(),
  });

  return docRef.id;
}

/**
 * Vérifie si les news doivent être rafraîchies pour une catégorie
 * @param {string} category - Catégorie à vérifier
 * @param {number} cacheDurationMs - Durée du cache en millisecondes
 * @return {Promise<boolean>} True si les news doivent être rafraîchies
 */
export async function shouldRefreshNews(
  category: string,
  cacheDurationMs: number
): Promise<boolean> {
  try {
    const snapshot = await articlesCol
      .where("category", "==", category)
      .orderBy("fetchedAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) return true;

    const lastArticle = snapshot.docs[0].data();
    const lastFetch = lastArticle.fetchedAt?.toDate?.() || new Date(0);
    const now = new Date();

    return now.getTime() - lastFetch.getTime() > cacheDurationMs;
  } catch (e) {
    console.warn("Error checking cache:", e);
    return true;
  }
}
