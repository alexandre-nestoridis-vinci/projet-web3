import * as logger from "firebase-functions/logger";
import {getFirestore} from "firebase-admin/firestore";
import {NewsArticle, NewsCategory} from "../types/types";

/**
 * Service pour générer des données de test par catégorie
 */
export class MockDataService {
  private db = getFirestore();

  /**
   * Catégories avec leurs données spécifiques
   */
  private categories: NewsCategory[] = [
    {
      id: "technology",
      name: "technology",
      displayName: "Technologie",
      color: "#3b82f6",
      icon: "laptop",
      description: "Actualités tech et innovation",
    },
    {
      id: "sports",
      name: "sports",
      displayName: "Sport",
      color: "#ef4444",
      icon: "trophy",
      description: "Actualités sportives",
    },
    {
      id: "politics",
      name: "politics",
      displayName: "Politique",
      color: "#8b5cf6",
      icon: "government",
      description: "Actualités politiques",
    },
    {
      id: "business",
      name: "business",
      displayName: "Économie",
      color: "#f59e0b",
      icon: "briefcase",
      description: "Actualités économiques",
    },
    {
      id: "health",
      name: "health",
      displayName: "Santé",
      color: "#10b981",
      icon: "heart",
      description: "Actualités santé",
    },
    {
      id: "science",
      name: "science",
      displayName: "Sciences",
      color: "#06b6d4",
      icon: "flask",
      description: "Actualités scientifiques",
    },
  ];

  /**
   * Templates d'articles par catégorie
   */
  private articleTemplates = {
    technology: [
      {
        title: "L'IA révolutionne l'industrie française",
        content: "Les entreprises françaises adoptent massivement l'intelligence artificielle pour automatiser leurs processus. Cette transformation numérique représente un enjeu majeur pour la compétitivité.",
        tags: ["IA", "France", "Innovation", "Automatisation"],
        keywords: ["intelligence artificielle", "automatisation", "innovation"],
      },
      {
        title: "Nouveau datacenter écologique en région parisienne",
        content: "Construction d'un datacenter alimenté à 100% par des énergies renouvelables. Ce projet pionnier vise à réduire l'empreinte carbone du numérique.",
        tags: ["Datacenter", "Écologie", "Paris", "Énergie"],
        keywords: ["datacenter", "écologique", "énergie renouvelable"],
      },
      {
        title: "Les startups françaises lèvent des fonds records",
        content: "Le secteur tech français bat des records de levées de fonds avec plus de 2 milliards d'euros investis cette année dans les startups innovantes.",
        tags: ["Startup", "Financement", "France", "Innovation"],
        keywords: ["startup", "levée de fonds", "innovation"],
      },
    ],
    sports: [
      {
        title: "Préparation intensive pour les JO de Paris 2024",
        content: "Les athlètes français s'entraînent intensivement en vue des Jeux Olympiques. Les infrastructures sportives sont prêtes à accueillir la compétition mondiale.",
        tags: ["JO", "Paris", "Sport", "Athlètes"],
        keywords: ["jeux olympiques", "préparation", "athlètes"],
      },
      {
        title: "Victoire historique de l'équipe de France de rugby",
        content: "L'équipe nationale remporte un match décisif face à l'Angleterre dans le Tournoi des Six Nations, marquant un tournant dans la saison.",
        tags: ["Rugby", "France", "Victoire", "Tournoi"],
        keywords: ["rugby", "équipe de france", "victoire"],
      },
      {
        title: "Nouveau record du monde en natation française",
        content: "Un nageur français établit un nouveau record mondial lors des championnats européens, prometteur pour les prochaines compétitions internationales.",
        tags: ["Natation", "Record", "France", "Championnat"],
        keywords: ["natation", "record mondial", "championnat"],
      },
    ],
    politics: [
      {
        title: "Nouvelle réforme de l'éducation nationale",
        content: "Le gouvernement présente son projet de réforme du système éducatif français, visant à moderniser l'enseignement et réduire les inégalités.",
        tags: ["Éducation", "Réforme", "Gouvernement", "France"],
        keywords: ["réforme", "éducation", "enseignement"],
      },
      {
        title: "Débat parlementaire sur la transition écologique",
        content: "L'Assemblée nationale examine les mesures pour accélérer la transition écologique française et atteindre les objectifs climatiques européens.",
        tags: ["Écologie", "Parlement", "Climat", "Transition"],
        keywords: ["transition écologique", "parlement", "climat"],
      },
      {
        title: "Accord européen sur la politique migratoire",
        content: "La France participe aux négociations européennes pour établir une politique migratoire commune et solidaire entre les États membres.",
        tags: ["Europe", "Migration", "Accord", "Politique"],
        keywords: ["accord européen", "migration", "politique"],
      },
    ],
    business: [
      {
        title: "La Bourse de Paris atteint de nouveaux sommets",
        content: "Le CAC 40 franchit un nouveau palier historique grâce aux performances des entreprises technologiques et de l'énergie renouvelable.",
        tags: ["Bourse", "CAC40", "Finance", "Paris"],
        keywords: ["bourse", "cac 40", "finance"],
      },
      {
        title: "Les PME françaises se digitalisent rapidement",
        content: "Accélération de la transformation numérique des petites et moyennes entreprises françaises, soutenue par les aides gouvernementales.",
        tags: ["PME", "Digital", "Transformation", "Entreprise"],
        keywords: ["pme", "digitalisation", "transformation"],
      },
      {
        title: "Inflation sous contrôle en zone euro",
        content: "Les derniers chiffres montrent une stabilisation de l'inflation dans la zone euro, permettant une reprise économique plus sereine.",
        tags: ["Inflation", "Europe", "Économie", "BCE"],
        keywords: ["inflation", "économie", "zone euro"],
      },
    ],
    health: [
      {
        title: "Avancée majeure dans le traitement du cancer",
        content: "Des chercheurs français développent une nouvelle immunothérapie prometteuse pour traiter certains types de cancers résistants.",
        tags: ["Cancer", "Recherche", "Traitement", "Innovation"],
        keywords: ["cancer", "immunothérapie", "recherche"],
      },
      {
        title: "Campagne de vaccination contre la grippe",
        content: "Lancement de la campagne annuelle de vaccination antigrippale dans toute la France, avec un accent sur les populations vulnérables.",
        tags: ["Vaccination", "Grippe", "Santé", "Prévention"],
        keywords: ["vaccination", "grippe", "prévention"],
      },
      {
        title: "Nouveaux médicaments approuvés par l'ANSM",
        content: "L'Agence nationale de sécurité du médicament approuve plusieurs nouveaux traitements innovants pour des maladies rares.",
        tags: ["Médicament", "ANSM", "Approbation", "Innovation"],
        keywords: ["médicament", "ansm", "traitement"],
      },
    ],
    science: [
      {
        title: "Découverte spatiale française majeure",
        content: "Le CNES annonce une découverte importante concernant Mars grâce aux données de la mission ExoMars, ouvrant de nouvelles perspectives.",
        tags: ["Espace", "Mars", "CNES", "Découverte"],
        keywords: ["espace", "mars", "cnes", "découverte"],
      },
      {
        title: "Percée en physique quantique au CNRS",
        content: "Des physiciens français réalisent une avancée significative dans le domaine de l'informatique quantique, rapprochant les applications pratiques.",
        tags: ["Quantique", "CNRS", "Physique", "Innovation"],
        keywords: ["physique quantique", "cnrs", "informatique"],
      },
      {
        title: "Nouveau traitement contre le réchauffement climatique",
        content: "Des scientifiques français développent une technologie révolutionnaire de capture du CO2 atmosphérique à grande échelle.",
        tags: ["Climat", "CO2", "Technologie", "Environnement"],
        keywords: ["climat", "co2", "environnement"],
      },
    ],
  };

  /**
   * Générer des articles de test pour une catégorie
   * @param {string} categoryId - ID de la catégorie
   * @param {number} count - Nombre d'articles à générer
   * @return {Promise<NewsArticle[]>} Articles générés
   */
  async generateArticlesForCategory(
    categoryId: string,
    count = 5
  ): Promise<NewsArticle[]> {
    const category = this.categories.find((c) => c.id === categoryId);
    if (!category) {
      throw new Error(`Catégorie ${categoryId} non trouvée`);
    }

    const templates = this.articleTemplates[categoryId as keyof typeof this.articleTemplates] || [];
    const articles: NewsArticle[] = [];

    for (let i = 0; i < Math.min(count, templates.length * 2); i++) {
      const template = templates[i % templates.length];
      const now = new Date();
      const publishDate = new Date(now.getTime() - (i * 60 * 60 * 1000)); // Échelonner les dates

      const article: NewsArticle = {
        id: `${categoryId}_${Date.now()}_${i}`,
        title: `${template.title} - ${i + 1}`,
        summary: this.generateSummary(template.content),
        content: template.content,
        category,
        source: "News IA France",
        author: "Rédaction IA",
        url: `https://news-ia.fr/articles/${categoryId}/${i + 1}`,
        publishedAt: publishDate,
        createdAt: now,
        updatedAt: now,
        status: "published" as const,
        aiGenerated: true,
        imageUrl: `https://picsum.photos/400/200?random=${Date.now() + i}`,
        tags: template.tags,
        keywords: template.keywords,
        sentiment: this.randomSentiment(),
        views: Math.floor(Math.random() * 1000) + 10,
        popularity: Math.random() * 0.3 + 0.7, // Score entre 0.7 et 1.0
      };

      articles.push(article);
    }

    return articles;
  }

  /**
   * Peupler la base de données avec des articles de test
   * @param {string} categoryId - Catégorie à peupler (ou "all")
   * @return {Promise<{saved: number; category: string}>}
   */
  async populateDatabase(
    categoryId = "all"
  ): Promise<{saved: number; category: string}> {
    try {
      let totalSaved = 0;
      const categoriesToProcess = categoryId === "all" ?
        this.categories.map((c) => c.id) :
        [categoryId];

      for (const catId of categoriesToProcess) {
        // Vérifier si des articles existent déjà
        const existingQuery = await this.db
          .collection("articles")
          .where("category.id", "==", catId)
          .limit(1)
          .get();

        if (existingQuery.empty) {
          // Générer des articles pour cette catégorie
          const articles = await this.generateArticlesForCategory(catId, 5);

          // Sauvegarder en batch
          const batch = this.db.batch();
          for (const article of articles) {
            const docRef = this.db.collection("articles").doc();
            batch.set(docRef, {
              ...article,
              id: docRef.id,
            });
          }

          await batch.commit();
          totalSaved += articles.length;
          logger.info(`${articles.length} articles générés pour ${catId}`);
        } else {
          logger.info(`Articles déjà présents pour ${catId}`);
        }
      }

      // Sauvegarder les catégories si elles n'existent pas
      const categoriesQuery = await this.db.collection("categories").limit(1).get();
      if (categoriesQuery.empty) {
        const batch = this.db.batch();
        for (const category of this.categories) {
          const docRef = this.db.collection("categories").doc(category.id);
          batch.set(docRef, category);
        }
        await batch.commit();
        logger.info(`${this.categories.length} catégories sauvegardées`);
      }

      return {saved: totalSaved, category: categoryId};
    } catch (error) {
      logger.error("Erreur population base:", error);
      throw error;
    }
  }

  /**
   * Générer un résumé à partir du contenu
   * @param {string} content - Contenu original
   * @return {string} Résumé
   */
  private generateSummary(content: string): string {
    const sentences = content.split(". ");
    return sentences.slice(0, 2).join(". ") + ".";
  }

  /**
   * Générer un sentiment aléatoire
   * @return {string} Sentiment
   */
  private randomSentiment(): "positive" | "negative" | "neutral" {
    const sentiments = ["positive", "negative", "neutral"] as const;
    const weights = [0.6, 0.1, 0.3]; // Plus de positif
    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return sentiments[i];
      }
    }

    return "neutral";
  }

  /**
   * Obtenir toutes les catégories
   * @return {NewsCategory[]} Liste des catégories
   */
  getCategories(): NewsCategory[] {
    return this.categories;
  }
}
