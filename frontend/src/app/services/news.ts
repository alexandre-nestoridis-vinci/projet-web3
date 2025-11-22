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

  // Expose a small helper to generate mock articles for a category (UI fallback)
  public generateMockForCategory(categoryId: string, count: number = 5): NewsArticle[] {
    const cat = this.getCategoryById(categoryId);
    return this.generateMockNews(cat, count);
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
    
    return [];
  }

  private processArticleWithAI(rawArticle: any, category: NewsCategory): Observable<NewsArticle> {
    // Map fields from the rawArticle returned by the backend into NewsArticle
    const id = rawArticle.id || rawArticle._id || '';
    const title = rawArticle.title || rawArticle.title || '';
    const content = rawArticle.content || rawArticle.description || '';
    const sourceName = (rawArticle.source && (typeof rawArticle.source === 'string' ? rawArticle.source : rawArticle.source.name)) || 'Unknown';
    const url = rawArticle.url || '';
    let publishedAt = rawArticle.publishedAt ? new Date(rawArticle.publishedAt) : new Date();
    // Normalize invalid dates -> fallback to now
    if (isNaN((publishedAt as Date).getTime())) {
      publishedAt = new Date();
    }
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
    const id = (categoryId || '').toString().toLowerCase();
    return this.categories.find(cat => (cat.id && cat.id.toLowerCase() === id) || (cat.name && cat.name.toLowerCase() === id)) || this.categories[0];
  }

  // Récupérer les news sauvegardées
  getSavedNewsByCategory(category: string): Observable<NewsArticle[]> {
    return this.firebaseService.getNewsByCategory(category);
  }

  getAllSavedNews(): Observable<NewsArticle[]> {
    return this.firebaseService.getRecentNews();
  }

  // Fetch all existing news from the backend (no category filter)
  // Public signature to ensure AOT/compiler sees the method in templates/components
  public fetchAllExistingNews(limit: number = 100): Observable<NewsArticle[]> {
    return this.backendService.fetchNews(undefined, limit).pipe(
      switchMap((res: any) => {
        const rawArticles: any[] = res?.articles || res || [];

        if (!rawArticles || rawArticles.length === 0) {
          return of([] as NewsArticle[]);
        }

        const slice = rawArticles.slice(0, limit);
        const observables = slice.map(a => {
          const catId = a.category || a.categoryName || this.getCategoryById('tech').id;
          const cat = this.getCategoryById(catId);
          return this.processArticleWithAI(a, cat);
        });

        return forkJoin(observables);
      }),
      catchError(err => {
        console.error('Erreur fetchAllExistingNews:', err);
        return of([] as NewsArticle[]);
      })
    );
  }

  // Fetch existing news from backend, optional category filter (does NOT create new news)
  // This method is for retrieving persisted articles only.
  public fetchExistingNews(category?: string, limit: number = 100): Observable<NewsArticle[]> {
    // First try: ask backend to filter server-side (preferred)
    return this.backendService.fetchNews(category, limit).pipe(
      switchMap((res: any) => {
        let rawArticles: any[] = res?.articles || res || [];

        if (rawArticles && rawArticles.length > 0) {
          // We received server-filtered results — map and return
          const slice = rawArticles.slice(0, limit);
          const observables = slice.map(a => {
            const catId = category || a.category || a.categoryName || this.getCategoryById('tech').id;
            const cat = this.getCategoryById(catId);
            return this.processArticleWithAI(a, cat);
          });
          return forkJoin(observables);
        }

        // If server returned no results for the specific category, try fetching all
        // persisted articles and perform tolerant client-side matching to avoid
        // showing mocks when persisted data actually exists under a different
        // category naming.
        return this.backendService.fetchNews(undefined, limit).pipe(
          switchMap((allRes: any) => {
            let allRaw: any[] = allRes?.articles || allRes || [];

            if (!allRaw || allRaw.length === 0) {
              // truly no persisted articles at all
              return of([] as NewsArticle[]);
            }

            if (!category) {
              // No category requested — just map the top results
              const slice = allRaw.slice(0, limit);
              const observables = slice.map(a => {
                const catId = a.category || a.categoryName || this.getCategoryById('tech').id;
                const cat = this.getCategoryById(catId);
                return this.processArticleWithAI(a, cat);
              });
              return forkJoin(observables);
            }

            const wanted = (category || '').toString().toLowerCase();
            const filtered = allRaw.filter((a: any) => {
              try {
                const rawCat = a.category || a.categoryName || '';
                if (!rawCat) return false;

                const rawStr = (typeof rawCat === 'string') ? rawCat.toLowerCase() : (rawCat.name || rawCat.id || '').toString().toLowerCase();

                if (rawStr === wanted) return true;
                if (rawStr.includes(wanted) || wanted.includes(rawStr)) return true;

                // compare against known categories
                const catObj = this.getCategoryById(wanted);
                if (catObj) {
                  const candidates = [catObj.id, catObj.name, catObj.displayName].map((x: any) => (x || '').toString().toLowerCase());
                  if (candidates.includes(rawStr)) return true;
                }
              } catch (e) {
                return false;
              }
              return false;
            });

            if (!filtered || filtered.length === 0) {
              return of([] as NewsArticle[]);
            }

            const slice = filtered.slice(0, limit);
            const observables = slice.map(a => {
              const catId = category || a.category || a.categoryName || this.getCategoryById('tech').id;
              const cat = this.getCategoryById(catId);
              return this.processArticleWithAI(a, cat);
            });

            return forkJoin(observables);
          })
        );
      }),
      catchError(err => {
        console.error('Erreur fetchExistingNews:', err);
        return of([] as NewsArticle[]);
      })
    );
  }
}
