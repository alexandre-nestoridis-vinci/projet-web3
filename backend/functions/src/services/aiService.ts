import * as logger from "firebase-functions/logger";
import {getFirestore} from "firebase-admin/firestore";
import {
  AIAnalysis,
} from "../types/types";

export interface AIAnalysisRequest {
  articleId: string;
  title: string;
  content: string;
  category?: string;
  analysisType?: "full" | "summary" | "sentiment" | "keywords";
}

// Utilisation du type AIAnalysis du fichier types.ts
export type AIAnalysisResult = AIAnalysis;

/**
 * Service d'analyse IA pour les articles de presse
 * Fournit des analyses de sentiment, extraction de mots-clés et résumés
 */
export class AIService {
  private db = getFirestore();

  /**
   * Analyse complète d'un article avec IA simulée
   * @param {AIAnalysisRequest} request Configuration de la requête d'analyse
   * @return {Promise<AIAnalysisResult>} Résultat complet de l'analyse IA
   */
  async analyzeArticle(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    const startTime = Date.now();

    try {
      logger.info("Début de l'analyse IA pour l'article:", request.articleId);

      // Simulation d'analyse IA (à remplacer par vraie API OpenAI/Gemini)
      const analysis = await this.simulateAIAnalysis(request);

      // Sauvegarder l'analyse en base
      const analysisDoc = {
        ...analysis,
        processedAt: new Date(),
        processingTime: Date.now() - startTime,
        success: true,
      };

      const docRef = await this.db.collection("ai-analyses").add(analysisDoc);

      const result: AIAnalysisResult = {
        id: docRef.id,
        ...analysisDoc,
      };

      logger.info("Analyse IA terminée avec succès:", {
        articleId: request.articleId,
        processingTime: result.processingTime,
        sentiment: result.sentiment,
      });

      return result;
    } catch (error) {
      logger.error("Erreur lors de l'analyse IA:", error);

      const failedAnalysis: AIAnalysisResult = {
        id: "",
        articleId: request.articleId,
        summary: "Erreur lors de l'analyse",
        keyPoints: [],
        keywords: [],
        sentiment: "neutral",
        sentimentScore: 0.5,
        confidence: 0,
        relatedTopics: [],
        processedAt: new Date(),
        processingTime: Date.now() - startTime,
        success: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return failedAnalysis;
    }
  }

  /**
   * Simulation d'analyse IA (à remplacer par vraie API)
   * @param {AIAnalysisRequest} request Configuration de la requête d'analyse
   * @return {Promise<Omit<AIAnalysisResult,
   *   "id" | "processedAt" | "processingTime" | "success">>}
   *   Analyse simulée sans métadonnées
   */
  private async simulateAIAnalysis(
    request: AIAnalysisRequest
  ): Promise<Omit<
    AIAnalysisResult,
    "id" | "processedAt" | "processingTime" | "success"
  >> {
    // Simulation d'un délai d'API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const {title, content} = request;
    const text = `${title} ${content}`;

    // Génération de résumé simulé
    const summary = this.generateSummary(content);

    // Extraction de mots-clés simulée
    const keywords = this.extractKeywords(text);

    // Analyse de sentiment simulée
    const sentimentAnalysis = this.analyzeSentiment(text);

    // Points clés simulés
    const keyPoints = this.extractKeyPoints(content);

    // Sujets connexes simulés
    const relatedTopics = this.findRelatedTopics(keywords);

    return {
      articleId: request.articleId,
      summary,
      keyPoints,
      keywords,
      sentiment: sentimentAnalysis.sentiment,
      sentimentScore: sentimentAnalysis.score,
      confidence: 0.85, // Confiance simulée
      relatedTopics,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Génération de résumé (logique simplifiée)
   * @param {string} content Contenu de l'article à résumer
   * @return {string} Résumé généré de l'article
   */
  private generateSummary(content: string): string {
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 20);

    if (sentences.length === 0) {
      return "Contenu insuffisant pour générer un résumé.";
    }

    // Prendre les 2-3 premières phrases significatives
    const summaryLength = Math.min(3, sentences.length);
    return sentences.slice(0, summaryLength).join(". ").trim() + ".";
  }

  /**
   * Extraction de mots-clés (logique simplifiée)
   * @param {string} text Texte à analyser pour extraire les mots-clés
   * @return {string[]} Liste des mots-clés extraits
   */
  private extractKeywords(text: string): string[] {
    const commonWords = new Set([
      "le", "la", "les", "un", "une", "des", "de",
      "du", "et", "à", "dans", "par", "pour", "avec",
      "sur", "sous", "entre", "vers", "chez", "sans",
      "plus", "moins", "très", "bien", "mal", "tout",
      "tous", "toute", "toutes", "ce", "cette", "ces",
      "qui", "que", "dont", "où", "quand", "comment",
      "pourquoi", "si", "comme", "depuis",
      "pendant", "avant", "après", "jusqu", "déjà", "encore", "jamais",
      "toujours",
    ]);

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) =>
        word.length > 3 &&
        !commonWords.has(word) &&
        isNaN(Number(word))
      );

    // Compter la fréquence des mots
    const wordCount = new Map<string, number>();
    words.forEach((word) => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Retourner les mots les plus fréquents
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map((entry) => entry[0]);
  }

  /**
   * Analyse de sentiment (logique simplifiée)
   * @param {string} text Texte à analyser pour déterminer le sentiment
   * @return {object} Sentiment détecté avec score de confiance
   */
  private analyzeSentiment(
    text: string
  ): { sentiment: "positive" | "negative" | "neutral"; score: number } {
    const positiveWords = [
      "bon", "excellent", "formidable", "génial", "super", "parfait",
      "réussi", "succès", "victoire", "progrès", "amélioration",
      "innovation", "opportunité", "espoir", "joie", "bonheur",
      "satisfaction", "optimisme", "positif",
    ];

    const negativeWords = [
      "mauvais", "terrible", "catastrophe", "échec", "problème",
      "crise", "danger", "risque", "menace", "guerre", "violence",
      "mort", "maladie", "accident", "erreur", "perte", "diminution",
      "baisse", "négatif", "inquiétude",
    ];

    const words = text.toLowerCase().split(/\s+/);

    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach((word) => {
      if (positiveWords.some((pos) => word.includes(pos))) {
        positiveCount++;
      }
      if (negativeWords.some((neg) => word.includes(neg))) {
        negativeCount++;
      }
    });

    const totalSentimentWords = positiveCount + negativeCount;

    if (totalSentimentWords === 0) {
      return {sentiment: "neutral", score: 0.5};
    }

    const positiveRatio = positiveCount / totalSentimentWords;

    if (positiveRatio > 0.6) {
      return {
        sentiment: "positive",
        score: 0.6 + (positiveRatio - 0.6) * 0.8,
      };
    } else if (positiveRatio < 0.4) {
      return {
        sentiment: "negative",
        score: 0.4 - (0.4 - positiveRatio) * 0.8,
      };
    } else {
      return {sentiment: "neutral", score: 0.5};
    }
  }

  /**
   * Extraction de points clés (logique simplifiée)
   * @param {string} content Contenu de l'article à analyser
   * @return {string[]} Liste des points clés identifiés
   */
  private extractKeyPoints(content: string): string[] {
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 30);

    if (sentences.length === 0) {
      return ["Aucun point clé identifié."];
    }

    // Identifier les phrases importantes (contenant des mots-clés spécifiques)
    const importantIndicators = [
      "important", "essentiel", "crucial", "principal", "majeur",
      "significatif", "révèle", "montre", "indique", "selon",
      "d'après", "résultat", "conclusion", "première fois",
      "nouveau", "innovation", "découverte", "annonce",
    ];

    const keyPoints = sentences.filter((sentence) => {
      const lowerSentence = sentence.toLowerCase();
      return importantIndicators.some((indicator) =>
        lowerSentence.includes(indicator)
      );
    });

    // Si pas assez de points identifiés, prendre les premières phrases
    if (keyPoints.length < 3) {
      return sentences
        .slice(0, Math.min(3, sentences.length))
        .map((s) => s.trim());
    }

    return keyPoints.slice(0, 5).map((s) => s.trim());
  }

  /**
   * Recherche de sujets connexes (logique simplifiée)
   * @param {string[]} keywords Mots-clés pour chercher des sujets connexes
   * @return {string[]} Liste des sujets connexes identifiés
   */
  private findRelatedTopics(keywords: string[]): string[] {
    const topicMappings: Record<string, string[]> = {
      "technologie": [
        "intelligence artificielle", "innovation", "numérique", "startup",
      ],
      "politique": [
        "gouvernement", "élection", "législation", "démocratie",
      ],
      "économie": [
        "finance", "marché", "entreprise", "croissance", "inflation",
      ],
      "sport": [
        "compétition", "champion", "équipe", "performance", "olympique",
      ],
      "santé": [
        "médecine", "traitement", "recherche", "prévention", "bien-être",
      ],
      "environnement": [
        "écologie", "climat", "durable", "énergie", "pollution",
      ],
    };

    const relatedTopics = new Set<string>();

    keywords.forEach((keyword) => {
      Object.entries(topicMappings).forEach(([topic, related]) => {
        if (related.some((r) => keyword.toLowerCase().includes(r))) {
          relatedTopics.add(topic);
          related.forEach((r) => relatedTopics.add(r));
        }
      });
    });

    return Array.from(relatedTopics).slice(0, 8);
  }

  /**
   * Statistiques d'analyse IA
   * @return {Promise<object>} Statistiques détaillées des analyses IA
   */
  async getAIStats(): Promise<{
    totalProcessed: number;
    successfullyProcessed: number;
    failedProcessing: number;
    averageProcessingTime: number;
    successRate: number;
    dailyProcessing: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [allAnalyses, todayAnalyses] = await Promise.all([
        this.db.collection("ai-analyses").get(),
        this.db.collection("ai-analyses")
          .where("processedAt", ">=", today)
          .get(),
      ]);

      const totalProcessed = allAnalyses.size;
      let successfullyProcessed = 0;
      let totalProcessingTime = 0;

      allAnalyses.forEach((doc) => {
        const data = doc.data();
        if (data.success) {
          successfullyProcessed++;
        }
        totalProcessingTime += data.processingTime || 0;
      });

      const failedProcessing = totalProcessed - successfullyProcessed;
      const averageProcessingTime = totalProcessed > 0 ?
        totalProcessingTime / totalProcessed :
        0;
      const successRate = totalProcessed > 0 ?
        successfullyProcessed / totalProcessed :
        0;
      const dailyProcessing = todayAnalyses.size;

      return {
        totalProcessed,
        successfullyProcessed,
        failedProcessing,
        averageProcessingTime,
        successRate,
        dailyProcessing,
      };
    } catch (error) {
      logger.error("Erreur lors du calcul des statistiques IA:", error);
      return {
        totalProcessed: 0,
        successfullyProcessed: 0,
        failedProcessing: 0,
        averageProcessingTime: 0,
        successRate: 0,
        dailyProcessing: 0,
      };
    }
  }

  /**
   * Récupérer l'analyse d'un article
   * @param {string} articleId Identifiant de l'article à analyser
   * @return {Promise<AIAnalysisResult | null>} Résultat de l'analyse ou null
   */
  async getAnalysisForArticle(
    articleId: string
  ): Promise<AIAnalysisResult | null> {
    try {
      const snapshot = await this.db
        .collection("ai-analyses")
        .where("articleId", "==", articleId)
        .where("success", "==", true)
        .orderBy("processedAt", "desc")
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        processedAt: data.processedAt?.toDate(),
      } as AIAnalysisResult;
    } catch (error) {
      logger.error("Erreur lors de la récupération de l'analyse:", error);
      return null;
    }
  }

  /**
   * Analyse plusieurs articles en lot
   * @param {string[]} articleIds Liste des identifiants d'articles à analyser
   * @param {boolean} forceReanalyze Forcer une nouvelle analyse
   * @return {Promise<AIAnalysisResult[]>} Résultats des analyses en lot
   */
  async batchAnalyzeArticles(
    articleIds: string[],
    forceReanalyze = false
  ): Promise<AIAnalysisResult[]> {
    const results: AIAnalysisResult[] = [];

    try {
      // Traiter par batch de 5 pour éviter la surcharge
      for (let i = 0; i < articleIds.length; i += 5) {
        const batch = articleIds.slice(i, i + 5);
        const batchPromises = batch.map(async (articleId) => {
          try {
            // Vérifier si l'analyse existe déjà
            if (!forceReanalyze) {
              const existing = await this.getAnalysisForArticle(articleId);
              if (existing) return existing;
            }

            // Récupérer l'article et l'analyser
            const articleDoc = await this.db.collection("articles")
              .doc(articleId).get();
            if (!articleDoc.exists) return null;

            const article = articleDoc.data();
            if (!article) return null;

            return await this.analyzeArticle({
              articleId: article.id,
              title: article.title,
              content: article.content,
            });
          } catch (error) {
            logger.error(`Erreur analyse article ${articleId}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter(
          (result): result is AIAnalysisResult => result !== null
        );
        results.push(...validResults);
      }

      return results;
    } catch (error) {
      logger.error("Erreur lors de l'analyse en lot:", error);
      return results;
    }
  }

  /**
   * Récupère les tendances de sentiment par catégorie
   * @param {object} options Options de filtrage pour les tendances
   * @return {Promise<object>} Données des tendances de sentiment
   */
  async getSentimentTrends(
    options: { category?: string; days?: number } = {}
  ): Promise<{
    sentimentByDay: [string, { positive: number; negative: number;
      neutral: number }][];
    overall: { positive: number; negative: number; neutral: number };
  }> {
    try {
      const {category, days = 30} = options;
      const cutoffDate = new Date(
        Date.now() - days * 24 * 60 * 60 * 1000
      );

      let query = this.db
        .collection("ai_analyses")
        .where("processedAt", ">=", cutoffDate);

      if (category) {
        // Note: Il faudrait ajouter un champ category dans ai_analyses
        query = query.where("category", "==", category);
      }

      const snapshot = await query.get();
      const sentimentByDay = new Map<
        string,
        { positive: number; negative: number; neutral: number }
      >();

      snapshot.forEach((doc) => {
        const analysis = doc.data();
        const day = analysis.processedAt.toDate().toISOString().split("T")[0];

        if (!sentimentByDay.has(day)) {
          sentimentByDay.set(day, {positive: 0, negative: 0, neutral: 0});
        }

        const dayStats = sentimentByDay.get(day);
        if (dayStats) {
          const sentiment = analysis.sentiment || "neutral";
          dayStats[sentiment as keyof typeof dayStats]++;
        }
      });

      const overall = {positive: 0, negative: 0, neutral: 0};
      sentimentByDay.forEach((stats) => {
        overall.positive += stats.positive;
        overall.negative += stats.negative;
        overall.neutral += stats.neutral;
      });

      return {
        sentimentByDay: Array.from(sentimentByDay.entries()),
        overall,
      };
    } catch (error) {
      logger.error("Erreur lors de la récupération des tendances:", error);
      return {
        sentimentByDay: [],
        overall: {positive: 0, negative: 0, neutral: 0},
      };
    }
  }

  /**
   * Récupère les mots-clés populaires extraits par l'IA
   * @param {object} options Options de filtrage pour les mots-clés
   * @return {Promise<string[]>} Liste des mots-clés populaires
   */
  async getPopularKeywords(
    options: { category?: string; limit?: number } = {}
  ): Promise<string[]> {
    try {
      const {category, limit = 20} = options;
      const cutoffDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      );

      let query = this.db
        .collection("ai_analyses")
        .where("processedAt", ">=", cutoffDate);

      if (category) {
        query = query.where("category", "==", category);
      }

      const snapshot = await query.get();
      const keywordCount = new Map<string, number>();

      snapshot.forEach((doc) => {
        const analysis = doc.data();
        analysis.keywords?.forEach((keyword: string) => {
          keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1);
        });
      });

      return Array.from(keywordCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([keyword]) => keyword);
    } catch (error) {
      logger.error("Erreur lors de la récupération des mots-clés:", error);
      return [];
    }
  }

  /**
   * Vérifie la santé des services IA
   * @return {Promise<object>} État de santé du service avec détails
   */
  async checkHealth(): Promise<{
    status: string;
    details?: {
      lastCheck: Date;
      responseTime?: string;
      error?: string;
    };
  }> {
    try {
      // Test basique de disponibilité
      const testAnalysis = await this.analyzeArticle({
        articleId: "health-check",
        title: "Test de santé du service IA",
        content:
          "Ceci est un test pour vérifier que le service IA fonctionne " +
          "correctement.",
      });

      if (testAnalysis) {
        return {
          status: "healthy",
          details: {
            lastCheck: new Date(),
            responseTime: "normal",
          },
        };
      } else {
        return {
          status: "unhealthy",
          details: {
            lastCheck: new Date(),
            error: "Échec de l'analyse de test",
          },
        };
      }
    } catch (error) {
      return {
        status: "unhealthy",
        details: {
          lastCheck: new Date(),
          error: error instanceof Error ? error.message : "Erreur inconnue",
        },
      };
    }
  }
}
