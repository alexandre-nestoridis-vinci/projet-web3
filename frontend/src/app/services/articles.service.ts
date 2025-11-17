import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  NewsArticle, 
  NewsRequest, 
  SearchSuggestion, 
  CategoryStats, 
  AIProcessingStats,
  AIAnalysis 
} from '../models/news.model';

@Injectable({
  providedIn: 'root'
})
export class ArticlesService {

  constructor(private http: HttpClient) {}

  private getApiUrl(endpoint: string): string {
    const apiEndpoint = environment.api.endpoints[endpoint as keyof typeof environment.api.endpoints];
    
    if (typeof apiEndpoint === 'string') {
      return apiEndpoint.startsWith('http') 
        ? apiEndpoint 
        : `${environment.api.baseUrl}${apiEndpoint}`;
    }
    
    // Fallback pour les nouveaux endpoints
    return environment.api.baseUrl ? 
      `${environment.api.baseUrl}/${endpoint}` : 
      `https://getarticles-4dizaotfxa-uc.a.run.app/`;
  }

  // 📰 Récupérer des articles avec filtres
  getArticles(request: NewsRequest = {}): Observable<any> {
    const params: any = {};
    
    if (request.category) params.category = request.category;
    if (request.limit) params.limit = request.limit.toString();
    if (request.offset) params.offset = request.offset.toString();
    if (request.sortBy) params.sortBy = request.sortBy;
    if (request.sortOrder) params.sortOrder = request.sortOrder;
    if (request.dateFrom) params.dateFrom = request.dateFrom.toISOString();
    if (request.dateTo) params.dateTo = request.dateTo.toISOString();
    if (request.source) params.source = request.source;
    if (request.status) params.status = request.status;

    return this.http.get(this.getApiUrl('getArticles'), { params });
  }

  // 🔍 Rechercher des articles
  searchArticles(query: string, category?: string, limit: number = 10): Observable<any> {
    const params: any = {
      q: query,
      limit: limit.toString()
    };
    
    if (category) params.category = category;

    return this.http.get(this.getApiUrl('searchArticles'), { params });
  }

  // 📄 Récupérer un article par ID
  getArticleById(id: string): Observable<any> {
    return this.http.get(this.getApiUrl('getArticle'), { 
      params: { id } 
    });
  }

  // 💡 Obtenir des suggestions de recherche
  getSearchSuggestions(query: string, limit: number = 10): Observable<any> {
    return this.http.get(this.getApiUrl('getSearchSuggestions'), {
      params: { 
        q: query,
        limit: limit.toString()
      }
    });
  }

  // 📊 Statistiques des catégories
  getCategoryStats(): Observable<any> {
    return this.http.get(this.getApiUrl('getCategoryStats'));
  }

  // 📈 Statistiques IA
  getAIStats(): Observable<any> {
    return this.http.get(this.getApiUrl('getAIStats'));
  }

  // 🤖 Analyser un article avec IA
  analyzeArticleWithAI(articleId: string): Observable<any> {
    return this.http.post(this.getApiUrl('analyzeArticleWithAI'), {
      articleId
    });
  }

  // 🏷️ Obtenir les catégories disponibles
  getAvailableCategories(): string[] {
    return [
      'technologie',
      'sport', 
      'politique',
      'economie',
      'sante',
      'environnement',
      'culture',
      'international'
    ];
  }

  // 🎨 Obtenir les informations d'une catégorie
  getCategoryInfo(categoryId: string) {
    const categories = {
      'technologie': {
        id: 'technologie',
        name: 'technologie', 
        displayName: 'Technologie',
        color: '#3b82f6',
        icon: 'laptop',
        description: 'Actualités tech et innovation'
      },
      'sport': {
        id: 'sport',
        name: 'sport',
        displayName: 'Sport', 
        color: '#ef4444',
        icon: 'trophy',
        description: 'Sport et compétitions'
      },
      'politique': {
        id: 'politique', 
        name: 'politique',
        displayName: 'Politique',
        color: '#8b5cf6',
        icon: 'users',
        description: 'Actualité politique'
      },
      'economie': {
        id: 'economie',
        name: 'economie', 
        displayName: 'Économie',
        color: '#10b981',
        icon: 'trending-up',
        description: 'Économie et finance'
      },
      'sante': {
        id: 'sante',
        name: 'sante',
        displayName: 'Santé', 
        color: '#f59e0b',
        icon: 'heart',
        description: 'Santé et médecine'
      },
      'environnement': {
        id: 'environnement',
        name: 'environnement',
        displayName: 'Environnement',
        color: '#22c55e', 
        icon: 'leaf',
        description: 'Écologie et environnement'
      },
      'culture': {
        id: 'culture',
        name: 'culture',
        displayName: 'Culture',
        color: '#ec4899',
        icon: 'palette', 
        description: 'Culture et divertissement'
      },
      'international': {
        id: 'international',
        name: 'international', 
        displayName: 'International',
        color: '#6366f1',
        icon: 'globe',
        description: 'Actualité internationale'
      }
    };

    return categories[categoryId as keyof typeof categories] || {
      id: categoryId,
      name: categoryId,
      displayName: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
      color: '#6b7280',
      icon: 'file-text',
      description: 'Catégorie'
    };
  }

  // 📖 Obtenir un article par son ID
  getArticle(articleId: string): Observable<any> {
    return this.http.get(this.getApiUrl('getArticle'), {
      params: { id: articleId }
    });
  }
}