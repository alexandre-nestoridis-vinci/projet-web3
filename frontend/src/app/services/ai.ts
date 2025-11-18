import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AINewsAnalysis, NewsArticle } from '../models/news.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AiService {

  constructor(private http: HttpClient) { }

  // Analyser un article avec l'IA (OpenAI GPT)
  analyzeNews(content: string): Observable<AINewsAnalysis> {
    // Pour le moment, simulons l'analyse IA
    // Plus tard, vous pourrez intégrer une vraie API IA
    
    const prompt = `
      Analyse cet article de presse et fournis:
      1. Un résumé en français de 2-3 phrases
      2. Les points clés (max 5 points)
      3. Le sentiment (positive, neutral, negative)
      4. Les sujets liés (max 5 mots-clés)
      
      Article: ${content}
    `;

    // Simulation d'une réponse IA pour le développement
    return of({
      summary: this.generateSummary(content),
      keyPoints: this.extractKeyPoints(content),
      sentiment: this.analyzeSentiment(content),
      relatedTopics: this.findRelatedTopics(content)
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de l\'analyse IA:', error);
        return of({
          summary: 'Résumé automatique non disponible.',
          keyPoints: ['Information non disponible'],
          sentiment: 'neutral' as const,
          relatedTopics: ['actualités']
        });
      })
    );
  }

  // Récupère des news réelles via le backend (qui appelle aiNewsService)
  fetchRealNews(category: string, limit = 5, forceRefresh = false) {
    // Construire l'URL vers le backend. Le backend expose /api/fetch-ai-news
    // On utilise environment.api.baseUrl si défini, sinon on tombe sur l'URL fournie en local.
    const base = environment.api?.baseUrl || '';
    const candidate = `${base}/api/fetch-ai-news`;
    // Certains environnements ont déjà une route complète dans baseUrl; acceptons aussi l'URL explicite
    const url = candidate.replace('//api/', '/api/');

    const body = { category, limit, forceRefresh };

    return this.http.post<any>(url, body).pipe(
      map(res => {
        if (res?.ok && Array.isArray(res.articles)) {
          return res.articles as NewsArticle[];
        }
        // If backend returned articles directly (older shape), try that
        if (Array.isArray(res)) return res as NewsArticle[];
        throw new Error(res?.message || 'No articles returned');
      }),
      catchError(err => {
        console.error('Erreur fetchRealNews:', err);
        // Fallback: return empty array so UI can handle gracefully
        return of([] as NewsArticle[]);
      })
    );
  }

  // Méthodes de simulation (à remplacer par de vraies API IA plus tard)
  private generateSummary(content: string): string {
    if (!content) return 'Aucun contenu disponible pour le résumé.';
    
    // Simulation simple : prendre les premiers mots
    const words = content.split(' ').slice(0, 50);
    return words.join(' ') + (content.split(' ').length > 50 ? '...' : '');
  }

  private extractKeyPoints(content: string): string[] {
    if (!content) return ['Aucun point clé disponible'];
    
    // Simulation : rechercher des phrases avec des mots-clés importants
    const sentences = content.split('.').filter(s => s.length > 20);
    return sentences.slice(0, 3).map(s => s.trim());
  }

  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    if (!content) return 'neutral';
    
    const positiveWords = ['succès', 'croissance', 'amélioration', 'innovation', 'victoire'];
    const negativeWords = ['crise', 'problème', 'échec', 'baisse', 'conflit'];
    
    const lowerContent = content.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private findRelatedTopics(content: string): string[] {
    if (!content) return ['actualités'];
    
    const topics = ['technologie', 'économie', 'politique', 'santé', 'sport', 'environnement'];
    const lowerContent = content.toLowerCase();
    
    return topics.filter(topic => lowerContent.includes(topic)).slice(0, 3);
  }

  // Méthode pour intégrer une vraie API IA plus tard
  private callOpenAI(prompt: string): Observable<any> {
    const headers = {
      'Authorization': `Bearer ${environment.openai.apiKey}`,
      'Content-Type': 'application/json'
    };

    const body = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7
    };

    return this.http.post('https://api.openai.com/v1/chat/completions', body, { headers });
  }
}
