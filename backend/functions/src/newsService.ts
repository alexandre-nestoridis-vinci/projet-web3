/**
 * News Service - No longer needed (using real AI)
 * Kept for potential future fallback scenarios
 */

import {Article} from "./types";

/**
 * Fetch news by category
 * This function is deprecated - use aiNewsService instead
 * @return {Promise<Article[]>} Empty array
 */
export async function fetchNewsByCategory(): Promise<Article[]> {
  console.warn(
    "fetchNewsByCategory is deprecated. Use aiNewsService instead."
  );
  return [];
}

