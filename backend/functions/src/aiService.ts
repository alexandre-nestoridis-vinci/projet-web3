/**
 * AI Service using OpenAI free tier (via unofficial API or mock)
 * For development: uses simple heuristics instead of real GPT-4
 * In production: integrate with actual OpenAI API
 */

import {AnalysisResult, Article} from "./types";

/**
 * Simple sentiment analysis (heuristic-based, no API call)
 */
function analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
  const positiveWords = [
    "excellent", "great", "wonderful", "amazing", "fantastic",
    "good", "positive", "gain", "profit", "success", "better",
    "growth", "increase", "improve", "innovation", "advanced",
  ];
  const negativeWords = [
    "bad", "terrible", "horrible", "awful", "worst",
    "negative", "loss", "fail", "failure", "crisis", "decline",
    "decrease", "poor", "problem", "danger", "risk",
  ];

  const lower = text.toLowerCase();
  const posCount = positiveWords.filter((w) => lower.includes(w)).length;
  const negCount = negativeWords.filter((w) => lower.includes(w)).length;

  if (posCount > negCount) return "positive";
  if (negCount > posCount) return "negative";
  return "neutral";
}

/**
 * Extract keywords using simple heuristics
 */
function extractKeywords(text: string, limit = 5): string[] {
  // Split into words, filter stop words
  const stopWords = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for",
    "from", "has", "he", "in", "is", "it", "of", "on", "or",
    "that", "the", "to", "was", "will", "with", "the",
  ]);

  const words = text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, limit);

  return [...new Set(words)];
}

/**
 * Generate summary using simple extraction
 */
function generateSummary(text: string, maxLength = 200): string {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  let summary = "";
  for (const sentence of sentences) {
    if (summary.length + sentence.length <= maxLength) {
      summary += sentence.trim() + ". ";
    } else {
      break;
    }
  }
  return summary.trim() || text.substring(0, maxLength);
}

/**
 * Analyze article using simple heuristics
 * TODO: Replace with real ChatGPT/Gemini API when available
 */
export async function analyzeArticle(article: Article): Promise<AnalysisResult> {
  const fullText = `${article.title} ${article.description} ${article.content}`;

  return {
    summary: generateSummary(fullText),
    sentiment: analyzeSentiment(fullText),
    keywords: extractKeywords(fullText),
  };
}
