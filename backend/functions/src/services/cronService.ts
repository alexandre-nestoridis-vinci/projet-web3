import * as logger from "firebase-functions/logger";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {NewsService} from "./newsService";
import {AIService} from "./aiService";
import {CRUDService} from "./crudService";

const newsService = new NewsService();
const aiService = new AIService();
const crudService = new CRUDService();

/**
 * Service de planification automatique des tâches
 */
export class CronService {
  /**
   * Mise à jour automatique des actualités - toutes les heures
   */
  static scheduleNewsUpdate = onSchedule(
    {
      schedule: "0 * * * *", // Toutes les heures
      timeZone: "Europe/Paris",
      memory: "1GiB",
      timeoutSeconds: 300,
    },
    async (event) => {
      try {
        logger.info(
          "Démarrage de la mise à jour automatique des actualités"
        );

        // Récupération depuis toutes les sources
        const [newsApiArticles, rssArticles] = await Promise.all([
          newsService.fetchFromNewsAPI("general"),
          newsService.fetchFromRSS(),
        ]);

        // Combinaison et déduplication
        const allArticles = [...newsApiArticles, ...rssArticles];
        const uniqueArticles = await newsService.deduplicateArticles(
          allArticles
        );

        // Sauvegarde en base
        let savedCount = 0;
        for (const article of uniqueArticles) {
          try {
            await crudService.createArticle(article);
            savedCount++;
          } catch (error) {
            logger.error("Erreur sauvegarde article:", error);
          }
        }

        logger.info(
          `Cron news update - ${savedCount} nouveaux articles sauvegardés`
        );
      } catch (error) {
        logger.error("Erreur cron mise à jour news:", error);
      }
    }
  );

  /**
   * Analyse IA des nouveaux articles - toutes les 2 heures
   */
  static scheduleAIAnalysis = onSchedule(
    {
      schedule: "0 */2 * * *", // Toutes les 2 heures
      timeZone: "Europe/Paris",
      memory: "2GiB",
      timeoutSeconds: 540,
    },
    async (event) => {
      try {
        logger.info(
          "Démarrage de l'analyse IA automatique des articles"
        );

        // Récupérer les articles sans analyse IA
        const result = await crudService.listArticles({
          limit: 50,
          orderBy: "createdAt",
          orderDirection: "desc",
        });

        let processedCount = 0;
        for (const article of result.articles) {
          // Vérifier si l'article n'a pas déjà d'été analysé
          if (!article.sentiment || !article.keywords?.length) {
            try {
              // Analyse IA complète
              const [aiAnalysis, fakeNewsDetection] =
                await Promise.all([
                  aiService.analyzeArticle({
                    articleId: article.id,
                    title: article.title,
                    content: article.content,
                  }),
                  aiService.detectFakeNews({
                    title: article.title,
                    content: article.content,
                    source: article.source,
                    url: article.url,
                  }),
                ]);

              // Mise à jour de l'article
              await crudService.updateArticle(article.id, {
                sentiment: aiAnalysis.sentiment,
                keywords: aiAnalysis.keywords,
                popularity: fakeNewsDetection.score,
              });

              processedCount++;
            } catch (error) {
              logger.error(
                `Erreur analyse IA article ${article.id}:`,
                error
              );
            }
          }
        }

        logger.info(
          `Cron IA analysis - ${processedCount} articles analysés`
        );
      } catch (error) {
        logger.error("Erreur cron analyse IA:", error);
      }
    }
  );

  /**
   * Nettoyage et optimisation - quotidien à 2h du matin
   */
  static scheduleCleanup = onSchedule(
    {
      schedule: "0 2 * * *", // Tous les jours à 2h
      timeZone: "Europe/Paris",
      memory: "512MiB",
      timeoutSeconds: 300,
    },
    async (event) => {
      try {
        logger.info("Démarrage du nettoyage quotidien");

        // Vider le cache
        crudService.clearCache();

        // Supprimer les anciens articles (plus de 30 jours)
        // Cette logique peut être implémentée selon les besoins

        logger.info("Nettoyage quotidien terminé");
      } catch (error) {
        logger.error("Erreur cron nettoyage:", error);
      }
    }
  );
}
