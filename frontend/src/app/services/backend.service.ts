import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  private baseUrl = environment.api.baseUrl;

  constructor(private http: HttpClient) {}

  // 🧪 Test de connexion Firestore backend
  testFirestore(): Observable<any> {
    const url = environment.api.endpoints.testFirestore;
    return this.http.get(url);
  }

  // 📰 Récupération des actualités
  fetchNews(category?: string, limit?: number): Observable<any> {
    const url = environment.api.endpoints.fetchNews;
    const params: any = {};
    
    if (category) params.category = category;
    if (limit) params.limit = limit;

    return this.http.get(url, { params });
  }

  // 🤖 Traitement IA d'un article
  processWithAI(articleData: any): Observable<any> {
    const url = environment.api.endpoints.processWithAI;
    return this.http.post(url, articleData);
  }

  // 📊 Analyse IA d'un texte
  analyzeText(text: string, analysisType: 'summary' | 'sentiment' | 'keywords' = 'summary'): Observable<any> {
    return this.processWithAI({
      text: text,
      type: analysisType,
      timestamp: new Date().toISOString()
    });
  }

  // 🏷️ Classification automatique d'articles
  categorizeArticle(article: { title: string, content: string }): Observable<any> {
    return this.processWithAI({
      title: article.title,
      content: article.content,
      type: 'categorization',
      timestamp: new Date().toISOString()
    });
  }
}