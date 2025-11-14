import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, switchMap } from 'rxjs';
import { NewsArticle, NewsCategory, NewsRequest, AINewsAnalysis } from '../models/news.model';
import { FirebaseService } from './firebase';
import { AiService } from './ai';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NewsService {

  private readonly categories: NewsCategory[] = [
    { id: 'tech', name: 'technology', displayName: 'Technologie', color: '#3b82f6', icon: 'laptop' },
    { id: 'sports', name: 'sports', displayName: 'Sport', color: '#ef4444', icon: 'trophy' },
    { id: 'politics', name: 'politics', displayName: 'Politique', color: '#8b5cf6', icon: 'government' },
    { id: 'business', name: 'business', displayName: 'Économie', color: '#f59e0b', icon: 'briefcase' },
    { id: 'health', name: 'health', displayName: 'Santé', color: '#10b981', icon: 'heart' },
    { id: 'science', name: 'science', displayName: 'Sciences', color: '#06b6d4', icon: 'flask' },
    { id: 'entertainment', name: 'entertainment', displayName: 'Divertissement', color: '#f97316', icon: 'film' }
  ];

  constructor(
    private http: HttpClient,
    private firebaseService: FirebaseService,
    private aiService: AiService
  ) { }

  getCategories(): NewsCategory[] {
    return this.categories;
  }

  // Récupérer les news du jour avec IA (version de test avec données simulées)
  fetchTodaysNews(request: NewsRequest): Observable<NewsArticle[]> {
    // Pour l'instant, utilisons des données de test
    const category = this.getCategoryById(request.category);
    const mockArticles = this.generateMockNews(category, request.limit || 5);
    
    return this.aiService.analyzeNews("Article de test").pipe(
      map(() => mockArticles)
    );
  }

  private generateMockNews(category: NewsCategory, count: number): NewsArticle[] {
    const articles: NewsArticle[] = [];
    
    for (let i = 0; i < count; i++) {
      articles.push({
        id: `${category.id}-${Date.now()}-${i}`,
        title: `${category.displayName} - Actualité ${i + 1}`,
        summary: `Ceci est un résumé d'article de test pour la catégorie ${category.displayName}. Cette actualité a été générée pour démontrer le fonctionnement de l'interface.`,
        content: `Contenu complet de l'article ${i + 1} dans la catégorie ${category.displayName}. Cette information est générée automatiquement pour les tests.`,
        category: category,
        source: 'Source de test',
        url: 'https://example.com',
        publishedAt: new Date(),
        aiGenerated: true,
        imageUrl: `https://picsum.photos/400/200?random=${Date.now() + i}`,
        tags: [`${category.name}`, 'test', 'actualité'],
        sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as any
      });
    }
    
    return articles;
  }

  private processArticleWithAI(rawArticle: any, category: NewsCategory): Observable<NewsArticle> {
    return this.aiService.analyzeNews(rawArticle.content || rawArticle.description).pipe(
      map(analysis => ({
        id: '',
        title: rawArticle.title,
        summary: analysis.summary,
        content: rawArticle.content || rawArticle.description,
        category: category,
        source: rawArticle.source.name,
        url: rawArticle.url,
        publishedAt: new Date(rawArticle.publishedAt),
        aiGenerated: true,
        imageUrl: rawArticle.urlToImage,
        tags: analysis.relatedTopics,
        sentiment: analysis.sentiment
      }))
    );
  }

  private getCategoryById(categoryId: string): NewsCategory {
    return this.categories.find(cat => cat.id === categoryId) || this.categories[0];
  }

  // Récupérer les news sauvegardées
  getSavedNewsByCategory(category: string): Observable<NewsArticle[]> {
    return this.firebaseService.getNewsByCategory(category);
  }

  getAllSavedNews(): Observable<NewsArticle[]> {
    return this.firebaseService.getRecentNews();
  }
}
