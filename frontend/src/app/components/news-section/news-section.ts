import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsCardComponent } from '../news-card/news-card';
import { NewsArticle, NewsCategory } from '../../models/news.model';

@Component({
  selector: 'app-news-section',
  standalone: true,
  imports: [CommonModule, NewsCardComponent],
  templateUrl: './news-section.html',
  styleUrl: './news-section.scss'
})
export class NewsSectionComponent {
  @Input() category!: NewsCategory;
  @Input() articles: NewsArticle[] = [];

  trackByArticleId(index: number, article: NewsArticle): string {
    return article.id;
  }
}
