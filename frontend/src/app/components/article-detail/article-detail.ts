// src/app/components/article-detail/article-detail.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; 
import { ActivatedRoute, RouterLink } from '@angular/router'; 
import { NewsArticle } from '../../models/news.model';
import { HeaderComponent } from '../header/header'; 
import { App } from '../home-content/home-content'; // 🚩 Import du composant qui contient les données
import { ArticleCacheService } from '../../services/article-cache'; // NOUVEL IMPORT

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, HeaderComponent], 
  templateUrl: './article-detail.html', // Corrigé en .html
  styleUrl: './article-detail.scss'
})
export class ArticleDetailComponent implements OnInit {
  article: NewsArticle | undefined;
  
  private route = inject(ActivatedRoute);
  // 🚩 INJECTION DU COMPOSANT QUI CONTIENT LA LISTE DES DONNÉES
  private articleCacheService = inject(ArticleCacheService);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
        // Récupère l'ID de l'article depuis l'URL
        const articleId = params.get('id'); 
        
        if (articleId) {
            // 🚩 CORRECTION : Utilise directement la méthode du service de cache
            this.article = this.articleCacheService.getArticleById(articleId);

            if (!this.article) {
                console.error(`Article non trouvé avec l'ID: ${articleId}. Le cache est-il vide ?`);
                // Gérer le cas où l'article est absent (ex: afficher un message d'erreur ou rediriger)
            }
        }
    });
}
  // --- Méthodes d'aide (pour l'affichage des sentiments/couleurs) ---
  getSentimentIcon(sentiment: string): string {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      default: return '😐';
    }
  }

  getSentimentColor(sentiment: string): string {
    switch (sentiment) {
      case 'positive': return '#10b981'; // Vert
      case 'negative': return '#ef4444'; // Rouge
      default: return '#7f52ff'; // Couleur neutre ou d'accentuation
    }
  }
}