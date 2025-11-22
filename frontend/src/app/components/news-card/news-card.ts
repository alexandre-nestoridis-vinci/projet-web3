import { Component, Input, inject } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { NewsArticle } from '../../models/news.model';
import { Router, RouterLink } from '@angular/router'; 

@Component({
  selector: 'app-news-card',
  standalone: true,
  imports: [CommonModule, RouterLink], 
  templateUrl: './news-card.html',
  styleUrl: './news-card.scss'
})
export class NewsCardComponent {
  @Input() article!: NewsArticle;
  
  // Injection du Router d'Angular
  private router = inject(Router);

  // Méthode pour gérer le clic sur la carte
  navigateToDetail() {
    // 🚩 VÉRIFICATION CRITIQUE : Navigation INTERNE pour l'IA
    if (this.article.aiGenerated && this.article.id) {
      // 1. Navigation INTERNE vers la page de détail (/article/ID)
      this.router.navigate(['/article', this.article.id]);
      return; // 🛑 Très important : empêche d'exécuter le code de lien externe ci-dessous
    } 
    
    // 2. Navigation externe (pour les articles réels sans contenu détaillé interne)
    if (this.article.url) {
        window.open(this.article.url, '_blank');
        return;
    }

    // Fallback si l'article n'est ni IA ni externe
    console.warn("Article non cliquable. Ni interne, ni externe.");
  }

  getSentimentIcon(sentiment: string): string {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      default: return '😐';
    }
  }

  getSentimentColor(sentiment: string): string {
    switch (sentiment) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      default: return '#6b7280';
    }
  }
}