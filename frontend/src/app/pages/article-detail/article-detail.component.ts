import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ArticlesService } from '../../services/articles.service';
import { NewsArticle, AIAnalysis } from '../../models/news.model';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './article-detail.component.html',
  styleUrl: './article-detail.component.scss'
})
export class ArticleDetailComponent implements OnInit {
  
  article: NewsArticle | null = null;
  aiAnalysis: AIAnalysis | null = null;
  similarArticles: NewsArticle[] = [];
  loading = false;
  error: string | null = null;
  analysisLoading = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private articlesService: ArticlesService
  ) {}

  ngOnInit() {
    const articleId = this.route.snapshot.paramMap.get('id');
    if (articleId) {
      this.loadArticle(articleId);
    } else {
      this.router.navigate(['/']);
    }
  }

  // 📰 Charger l'article
  loadArticle(articleId: string) {
    this.loading = true;
    this.error = null;

    this.articlesService.getArticle(articleId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.article = response.data;
          this.loadAIAnalysis(articleId);
          this.loadSimilarArticles();
        } else {
          this.error = 'Article non trouvé';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'article:', error);
        this.error = 'Erreur lors du chargement de l\'article';
        this.loading = false;
      }
    });
  }

  // 🤖 Charger l'analyse IA
  loadAIAnalysis(articleId: string) {
    this.analysisLoading = true;

    this.articlesService.analyzeArticleWithAI(articleId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.aiAnalysis = response.data;
        }
        this.analysisLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors de l\'analyse IA:', error);
        this.analysisLoading = false;
      }
    });
  }

  // 🔍 Charger les articles similaires
  loadSimilarArticles() {
    if (!this.article) return;

    // Rechercher des articles de la même catégorie
    this.articlesService.getArticles({
      category: typeof this.article.category === 'string' ? 
        this.article.category : 
        this.article.category.id,
      limit: 4
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Exclure l'article actuel
          this.similarArticles = response.data.filter(
            (a: NewsArticle) => a.id !== this.article?.id
          ).slice(0, 3);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des articles similaires:', error);
      }
    });
  }

  // 📅 Formater une date
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // 😊 Obtenir l'emoji du sentiment
  getSentimentEmoji(sentiment?: string): string {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      case 'neutral': return '😐';
      default: return '';
    }
  }

  // 🎯 Obtenir la classe CSS du sentiment
  getSentimentClass(sentiment?: string): string {
    switch (sentiment) {
      case 'positive': return 'positive';
      case 'negative': return 'negative';
      case 'neutral': return 'neutral';
      default: return 'neutral';
    }
  }

  // 🎨 Obtenir les infos de catégorie
  getCategoryInfo(): any {
    if (!this.article?.category) return { displayName: 'Non catégorisé', color: '#6b7280' };
    
    if (typeof this.article.category === 'string') {
      return { displayName: this.article.category, color: '#6b7280' };
    }
    
    return {
      displayName: this.article.category.displayName || this.article.category.name,
      color: this.article.category.color || '#6b7280'
    };
  }

  // 🔗 Naviguer vers un article similaire
  goToArticle(articleId: string) {
    this.router.navigate(['/article', articleId]);
  }

  // ↩️ Retourner à l'accueil
  goBack() {
    this.router.navigate(['/']);
  }

  // 🔄 Actualiser l'analyse IA
  refreshAnalysis() {
    if (this.article) {
      this.loadAIAnalysis(this.article.id);
    }
  }
}