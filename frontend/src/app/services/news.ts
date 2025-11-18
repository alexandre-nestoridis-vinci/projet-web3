import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, switchMap, of, catchError } from 'rxjs';
import { NewsArticle, NewsCategory, NewsRequest } from '../models/news.model';
import { FirebaseService } from './firebase';
import { AiService } from './ai';
import { BackendService } from './backend.service';

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
    private aiService: AiService,
    private backendService: BackendService
  ) { }

  getCategories(): NewsCategory[] {
    return this.categories;
  }

  // Récupérer les news du jour avec IA (version de test avec données simulées)
  fetchTodaysNews(request: NewsRequest): Observable<NewsArticle[]> {
    // Récupérer des articles bruts via le backend, puis les analyser un à un
    console.log(request);
    const category = this.getCategoryById(request.category);
    const limit = request.limit || 5;

    return this.backendService.processWithAI(category.name).pipe(
      switchMap((res: any) => {
        console.log(res);
        // backendService.fetchNews peut renvoyer { ok: true, articles: [...] } ou directement un tableau
        const rawArticles: any[] = res?.articles || res || [];

        if (!rawArticles || rawArticles.length === 0) {
          // fallback local
          return of(this.generateMockNews(category, limit));
        }

        // limiter au paramètre limit et convertir chaque rawArticle en NewsArticle via processArticleWithAI
        const slice = rawArticles.slice(0, limit);
        const observables = slice.map(a => this.processArticleWithAI(a, category));

        // forkJoin attend un array d'observables et émet un tableau de NewsArticle lorsque tous terminent
        return forkJoin(observables);
      }),
      catchError(err => {
        console.error('Erreur fetchTodaysNews:', err);
        return of(this.generateMockNews(category, limit));
      })
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
    // Map fields from the rawArticle returned by the backend into NewsArticle
    const id = rawArticle.id || rawArticle._id || '';
    const title = rawArticle.title || rawArticle.title || '';
    const content = rawArticle.content || rawArticle.description || '';
    const sourceName = (rawArticle.source && (typeof rawArticle.source === 'string' ? rawArticle.source : rawArticle.source.name)) || 'Unknown';
    const url = rawArticle.url || '';
    const publishedAt = rawArticle.publishedAt ? new Date(rawArticle.publishedAt) : new Date();
    const imageUrl = rawArticle.urlToImage || rawArticle.imageUrl || '';

    const mapped: NewsArticle = {
      id,
      title,
      summary: rawArticle.summary || (content ? content.split('.').slice(0, 2).join('. ') : ''),
      content,
      category,
      source: sourceName,
      url,
      publishedAt,
      aiGenerated: Boolean(rawArticle.summary || rawArticle.aiGenerated),
      imageUrl,
      tags: rawArticle.keywords || rawArticle.tags || [],
      sentiment: (rawArticle.sentiment as any) || 'neutral'
    };

    return of(mapped);
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
