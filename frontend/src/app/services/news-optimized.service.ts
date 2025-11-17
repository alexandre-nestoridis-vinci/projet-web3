import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { map, catchError, retry, debounceTime, distinctUntilChanged, shareReplay, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * Service de gestion des articles avec bonnes pratiques Angular
 * - Gestion d'état réactive avec RxJS
 * - Cache intelligent
 * - Gestion d'erreurs robuste
 * - Performance optimisée
 */

export interface ArticleFilter {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'publishedAt' | 'popularity' | 'views';
  sortOrder?: 'asc' | 'desc';
}

export interface UIState<T = any> {
  loading: boolean;
  data: T;
  error: string | null;
  lastUpdated: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.api.baseUrl;

  // =====================================================
  // ÉTAT RÉACTIF AVEC RXJS
  // =====================================================

  private readonly articlesState = new BehaviorSubject<UIState<any[]>>({
    loading: false,
    data: [],
    error: null,
    lastUpdated: null
  });

  private readonly searchState = new BehaviorSubject<UIState<any[]>>({
    loading: false,
    data: [],
    error: null,
    lastUpdated: null
  });

  private readonly categoriesState = new BehaviorSubject<UIState<any[]>>({
    loading: false,
    data: [],
    error: null,
    lastUpdated: null
  });

  // Observables publics en lecture seule
  public readonly articles$ = this.articlesState.asObservable();
  public readonly searchResults$ = this.searchState.asObservable();
  public readonly categories$ = this.categoriesState.asObservable();

  // =====================================================
  // CACHE ET OPTIMISATION
  // =====================================================

  private readonly cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = {
    articles: 5 * 60 * 1000,    // 5 minutes
    categories: 30 * 60 * 1000, // 30 minutes
    search: 2 * 60 * 1000       // 2 minutes
  };

  // =====================================================
  // MÉTHODES PUBLIQUES
  // =====================================================

  /**
   * Récupère les articles avec filtres
   */
  getArticles(filter: ArticleFilter = {}): Observable<any[]> {
    const cacheKey = this.generateCacheKey('articles', filter);
    
    // Vérifier le cache d'abord
    if (this.isValidCache(cacheKey)) {
      const cachedData = this.cache.get(cacheKey)!.data;
      this.updateArticlesState({ 
        loading: false, 
        data: cachedData, 
        error: null,
        lastUpdated: new Date()
      });
      return throwError(() => cachedData);
    }

    // Mettre à jour l'état de chargement
    this.updateArticlesState({ 
      ...this.articlesState.value, 
      loading: true, 
      error: null 
    });

    const params = this.buildHttpParams(filter);

    return this.http.get<any>(`${this.baseUrl}/api/news`, { params }).pipe(
      map(response => response.data || []),
      retry({
        count: 2,
        delay: (error, retryCount) => {
          console.warn(`Tentative ${retryCount} échouée, retry dans 1s`, error);
          return timer(1000);
        }
      }),
      catchError((error) => this.handleError('articlesState')(error)),
      finalize(() => {
        this.updateArticlesState({ 
          ...this.articlesState.value, 
          loading: false 
        });
      }),
      shareReplay(1)
    );
  }

  /**
   * Recherche d'articles avec debouncing
   */
  searchArticles(query: string, filter: ArticleFilter = {}): Observable<any[]> {
    if (!query || query.trim().length < 2) {
      this.updateSearchState({
        loading: false,
        data: [],
        error: null,
        lastUpdated: new Date()
      });
      return throwError(() => []);
    }

    const searchFilter = { ...filter, search: query.trim() };
    const cacheKey = this.generateCacheKey('search', searchFilter);

    // Cache check
    if (this.isValidCache(cacheKey)) {
      const cachedData = this.cache.get(cacheKey)!.data;
      this.updateSearchState({
        loading: false,
        data: cachedData,
        error: null,
        lastUpdated: new Date()
      });
      return throwError(() => cachedData);
    }

    this.updateSearchState({
      ...this.searchState.value,
      loading: true,
      error: null
    });

    const params = new HttpParams().set('q', query.trim());
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      }
    });

    return this.http.get<any>(`${this.baseUrl}/api/search`, { params }).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      map(response => response.data || []),
      retry(1),
      catchError((error) => this.handleError('searchState')(error)),
      finalize(() => {
        this.updateSearchState({
          ...this.searchState.value,
          loading: false
        });
      }),
      shareReplay(1)
    );
  }

  /**
   * Récupère un article par ID
   */
  getArticleById(id: string): Observable<any> {
    const cacheKey = `article-${id}`;
    
    if (this.isValidCache(cacheKey)) {
      return throwError(() => this.cache.get(cacheKey)!.data);
    }

    return this.http.get<any>(`${this.baseUrl}/api/news/${id}`).pipe(
      map(response => response.data),
      retry(1),
      catchError((error) => this.handleError()(error)),
      shareReplay(1)
    );
  }

  /**
   * Récupère les catégories avec statistiques
   */
  getCategories(): Observable<any[]> {
    const cacheKey = 'categories';
    
    if (this.isValidCache(cacheKey)) {
      const cachedData = this.cache.get(cacheKey)!.data;
      this.updateCategoriesState({
        loading: false,
        data: cachedData,
        error: null,
        lastUpdated: new Date()
      });
      return throwError(() => cachedData);
    }

    this.updateCategoriesState({
      ...this.categoriesState.value,
      loading: true,
      error: null
    });

    return this.http.get<any>(`${this.baseUrl}/api/news/categories/stats`).pipe(
      map(response => response.data || []),
      retry(1),
      catchError((error) => this.handleError('categoriesState')(error)),
      finalize(() => {
        this.updateCategoriesState({
          ...this.categoriesState.value,
          loading: false
        });
      }),
      shareReplay(1)
    );
  }

  /**
   * Incrémente les vues d'un article
   */
  incrementViews(articleId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/news/${articleId}/views`, {}).pipe(
      catchError(error => {
        console.warn('Erreur lors de l\'incrémentation des vues:', error);
        return throwError(() => null); // Ne pas faire échouer l'affichage
      })
    );
  }

  // =====================================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // =====================================================

  /**
   * Met à jour l'état des articles
   */
  private updateArticlesState(newState: UIState<any[]>): void {
    this.articlesState.next(newState);
    
    // Mise en cache si pas d'erreur
    if (!newState.error && newState.data.length > 0) {
      this.setCache('articles-current', newState.data, this.CACHE_TTL.articles);
    }
  }

  /**
   * Met à jour l'état de recherche
   */
  private updateSearchState(newState: UIState<any[]>): void {
    this.searchState.next(newState);
    
    if (!newState.error && newState.data.length > 0) {
      this.setCache('search-current', newState.data, this.CACHE_TTL.search);
    }
  }

  /**
   * Met à jour l'état des catégories
   */
  private updateCategoriesState(newState: UIState<any[]>): void {
    this.categoriesState.next(newState);
    
    if (!newState.error && newState.data.length > 0) {
      this.setCache('categories', newState.data, this.CACHE_TTL.categories);
    }
  }

  /**
   * Gestion centralisée des erreurs
   */
  private handleError(stateKey?: string) {
    return (error: HttpErrorResponse) => {
      console.error('Erreur API:', error);
      
      let errorMessage = 'Une erreur est survenue';
      
      if (error.status === 0) {
        errorMessage = 'Problème de connexion réseau';
      } else if (error.status >= 500) {
        errorMessage = 'Erreur serveur temporaire';
      } else if (error.status === 404) {
        errorMessage = 'Ressource non trouvée';
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      }

      // Mettre à jour l'état correspondant
      if (stateKey === 'articlesState') {
        this.updateArticlesState({
          ...this.articlesState.value,
          loading: false,
          error: errorMessage
        });
      } else if (stateKey === 'searchState') {
        this.updateSearchState({
          ...this.searchState.value,
          loading: false,
          error: errorMessage
        });
      } else if (stateKey === 'categoriesState') {
        this.updateCategoriesState({
          ...this.categoriesState.value,
          loading: false,
          error: errorMessage
        });
      }

      return throwError(() => new Error(errorMessage));
    };
  }

  /**
   * Construction des paramètres HTTP
   */
  private buildHttpParams(filter: ArticleFilter): HttpParams {
    let params = new HttpParams();
    
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });
    
    return params;
  }

  /**
   * Génère une clé de cache basée sur les paramètres
   */
  private generateCacheKey(prefix: string, params: any): string {
    const sortedParams = Object.keys(params).sort().reduce((result: any, key) => {
      result[key] = params[key];
      return result;
    }, {});
    
    return `${prefix}-${JSON.stringify(sortedParams)}`;
  }

  /**
   * Vérifie si un élément en cache est encore valide
   */
  private isValidCache(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Met en cache une donnée avec TTL
   */
  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Nettoie le cache expiré
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Nettoie les ressources lors de la destruction du service
   */
  ngOnDestroy(): void {
    this.cache.clear();
    this.articlesState.complete();
    this.searchState.complete();
    this.categoriesState.complete();
  }
}