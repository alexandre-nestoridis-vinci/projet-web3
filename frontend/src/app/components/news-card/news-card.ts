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
    // Navigation interne uniquement vers la page de détail
    if (this.article.id) {
      this.router.navigate(['/article', this.article.id]);
      return;
    }
    // Fallback si l'article n'a pas d'id
    console.warn("Article non cliquable : pas d'id.");
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