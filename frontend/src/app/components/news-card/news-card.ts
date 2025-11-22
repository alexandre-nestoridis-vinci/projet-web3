import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsArticle } from '../../models/news.model';
import { RouterLink } from '@angular/router'; // 🚩 CORRECTION : Ajout de l'import RouterLink

@Component({
  selector: 'app-news-card',
  standalone: true,
  // 🚩 CORRECTION : Ajout de RouterLink au tableau imports
  imports: [CommonModule, RouterLink], 
  templateUrl: './news-card.html',
  styleUrl: './news-card.scss'
})
export class NewsCardComponent {
  @Input() article!: NewsArticle;

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