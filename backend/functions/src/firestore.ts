import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();

/**
 * Articles collection reference
 * Structure: {
 *   title, description, content, url, source, publishedAt,
 *   category, dedupHash, summary?, sentiment?, keywords?,
 *   fetchedAt
 * }
 */
export const articlesCol = db.collection("articles");

/**
 * Categories reference (optional for managing categories)
 */
export const categoriesCol = db.collection("categories");
