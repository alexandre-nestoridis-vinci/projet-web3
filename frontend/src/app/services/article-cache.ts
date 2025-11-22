import { Injectable } from '@angular/core';
import { NewsArticle } from '../models/news.model';

@Injectable({
  providedIn: 'root' // Le service est disponible globalement
})
export class ArticleCacheService {
  // 🚩 La liste des articles stockée globalement
  public allArticlesCache: NewsArticle[] = [];

  constructor() { }

  getArticleById(id: string): NewsArticle | undefined {
    return this.allArticlesCache.find(a => a.id === id);
  }
}