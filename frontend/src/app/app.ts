import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header';
import { CategoryFilterComponent } from './components/category-filter/category-filter';
import { NewsCardComponent } from './components/news-card/news-card';
import { NewsService } from './services/news';
import { BackendService } from './services/backend.service';
import { NewsArticle, NewsCategory } from './models/news.model';

@Component({
  selector: 'app-root',
  standalone: true, 
  imports: [
    RouterOutlet, 
    CommonModule,
    HeaderComponent, 
    CategoryFilterComponent,
    NewsCardComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  title = 'News AI';
  categories: NewsCategory[] = [];
  activeCategories: NewsCategory[] = [];
  articles: NewsArticle[] = [];
  isLoading = false;
  sortOrder: 'newest' | 'oldest' = 'newest';
  sourceFilter: string = '';
  sourceSearchTerm: string = '';
  searchTerm: string = '';
  allFetchedNews: NewsArticle[] = [];
  suggestionResults: NewsArticle[] = [];
  searchResults: NewsArticle[] = [];
  searchActive: boolean = false;

  constructor(private newsService: NewsService, private backendService: BackendService) {}

  // Map a raw article (from backend) to NewsArticle for search display
  private mapRawToNewsArticle(raw: any): NewsArticle {
    const id = raw.id || raw._id || '';
    const title = raw.title || raw.name || 'Sans titre';
    const content = raw.content || raw.description || '';
    const source = (typeof raw.source === 'string') ? raw.source : (raw.source?.name || 'Unknown');
    let publishedAt = raw.publishedAt ? new Date(raw.publishedAt) : new Date();
    if (isNaN((publishedAt as Date).getTime())) {
      publishedAt = new Date();
    }

    const catId = (raw.category || raw.categoryName || '').toString().toLowerCase();
    const category = this.categories.find(c => c.id === catId || c.name === catId) || this.categories[0];

    return {
      id,
      title,
      summary: raw.summary || (content ? content.split('.').slice(0,2).join('. ') : ''),
      content,
      category,
      source,
      url: raw.url || '',
      publishedAt,
      aiGenerated: Boolean(raw.aiGenerated),
      imageUrl: raw.urlToImage || raw.imageUrl || '',
      tags: raw.keywords || raw.tags || [],
      sentiment: (raw.sentiment as any) || 'neutral'
    } as NewsArticle;
  }

  // 🚩 DÉMARRAGE : Simplifié pour charger toutes les news persistées
  ngOnInit() {
    this.categories = this.newsService.getCategories();
    
    // Charger directement TOUTES les news persistées pour l'affichage initial
    this.loadAllNews(200); 
  }
  
  onNewsGenerated(receivedData: any): void {
    if (!receivedData) {
      console.warn("Aucune donnée reçue de l'IA.");
      return;
    }

    let newArticles: NewsArticle[] = [];

    if (Array.isArray(receivedData)) {
        newArticles = receivedData;
    } else if (receivedData.articles && Array.isArray(receivedData.articles)) {
        newArticles = receivedData.articles;
    } else {
        newArticles = [receivedData];
    }
    
    if (newArticles.length === 0) {
      console.warn("Aucun article valide trouvé dans la réponse de l'IA.");
      return;
    }
    
    const mappedArticles = newArticles
        .filter(article => article && article.title)
        .map(raw => this.mapRawToNewsArticle(raw));
    
    
    if (mappedArticles.length === 0) {
      console.warn("Les articles reçus n'ont pas pu être mappés au format NewsArticle.");
      return;
    }
    
    console.log(`Ajout de ${mappedArticles.length} nouveaux articles générés par l'IA.`);

    this.allFetchedNews = [...mappedArticles, ...this.allFetchedNews]; 
    this.articles = [...mappedArticles, ...this.articles];
    
    this.searchActive = false; 
    this.activeCategories = []; 
  }


  // NOTE: Cette méthode n'est plus appelée par ngOnInit
  onCategorySelected(category: NewsCategory) {
    this.isLoading = true;

    if (typeof (this.newsService as any).fetchExistingNews === 'function') {
      (this.newsService as any).fetchExistingNews(category.name, 10).subscribe({
        next: (articles: NewsArticle[]) => {
          this.articles = [...articles];
          
          this.activeCategories = []; 
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des news (existing) par l\'API:', error);
          
          this.articles = []; 
          
          this.activeCategories = []; 
          this.isLoading = false;
        }
      });
    } else {
      this.newsService.fetchTodaysNews({
        category: category.id,
        limit: 10,
        language: 'fr'
      }).subscribe({
        next: (articles: NewsArticle[]) => {
          this.articles = [...articles];
          this.activeCategories = []; 
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement desnews:', error);
          this.articles = []; 
          this.activeCategories = []; 
          this.isLoading = false;
        }
      });
    }
  }

  // Change sort order (triggered depuis the template)
  onSortChange(order: string) {
    if (order === 'newest' || order === 'oldest') {
      this.sortOrder = order;
    } else {
      this.sortOrder = 'newest';
    }
  }

// Dans src/app/app.ts
  onSearchFocus() {
    // Si le terme de recherche est vide, on arrête ici et on vide les suggestions.
    // Cela empêche l'affichage du menu s'il n'y a rien à rechercher.
    if (!this.searchTerm || this.searchTerm.length === 0) {
        this.suggestionResults = [];
        return;
    }
    
    // Logique existante pour charger/rafraîchir les suggestions si searchTerm n'est pas vide
    if (this.allFetchedNews.length === 0) {
      if (typeof (this.newsService as any).fetchExistingNews === 'function') {
        (this.newsService as any).fetchExistingNews(undefined, 200).subscribe({
          next: (articles: NewsArticle[]) => {
            this.allFetchedNews = articles;
            this.suggestionResults = articles.slice(0, 10);
          },
          error: (err: any) => {
            console.error('Erreur fetchExistingNews:', err);
            this.allFetchedNews = [];
          }
        });
      } else {
        this.loadAllNews(200);
      }
    } else {
      // Affiche les 10 premières suggestions (basées sur la liste globale)
      this.suggestionResults = this.allFetchedNews.slice(0, 10);
    }
  }

  // Try to load all news via NewsService.fetchAllExistingNews if available,
  // otherwise fallback to backendService.fetchNews and map results.
  private loadAllNews(limit = 200) {
    if (typeof (this.newsService as any).fetchAllExistingNews === 'function') {
      (this.newsService as any).fetchAllExistingNews(limit).subscribe({
        next: (articles: NewsArticle[]) => {
          this.allFetchedNews = articles;
          this.articles = articles; // Rempli la liste d'affichage
          this.suggestionResults = articles.slice(0, 10);
        },
        error: (err: any) => {
          console.error('Erreur fetchAllExistingNews init:', err);
          this.loadSavedNews();
        }
      });
    } else {
      this.backendService.fetchNews(undefined, limit).subscribe({
        next: (res: any) => {
          const raw = res?.articles || res || [];
          const mapped = (raw || []).map((r: any) => this.mapRawToNewsArticle(r));
          this.allFetchedNews = mapped;
          this.articles = mapped; // Rempli la liste d'affichage
          this.suggestionResults = mapped.slice(0, 10);
        },
        error: (err: any) => {
          console.error('Erreur fetchNews fallback init:', err);
          this.loadSavedNews();
        }
      });
    }
  }

  onSearchInput(value: string) {
    this.searchTerm = value || '';
    const q = this.searchTerm.trim().toLowerCase();

    if (!q) {
      this.suggestionResults = this.allFetchedNews.slice(0, 10);
      return;
    }

    this.suggestionResults = this.allFetchedNews.filter(a => {
      return (a.title || '').toLowerCase().includes(q)
        || (a.summary || '').toLowerCase().includes(q)
        || (a.content || '').toLowerCase().includes(q)
        || (a.source || '').toLowerCase().includes(q);
    }).slice(0, 20);
  }

  // When user confirms search (enter or select suggestion)
  onSearchSubmit() {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) {
      const noCategory = !this.activeCategories || this.activeCategories.length === 0;
      const noSourceFilter = !this.sourceFilter || this.sourceFilter.trim() === '';

      if (noCategory && noSourceFilter) {
        this.searchResults = this.allFetchedNews;
        this.articles = [...this.allFetchedNews];
        this.searchActive = true;
        this.suggestionResults = [];
      } else {
        this.searchActive = false;
      }

      return;
    }

    const results = this.allFetchedNews.filter(a => {
      return (a.title || '').toLowerCase().includes(q)
        || (a.summary || '').toLowerCase().includes(q)
        || (a.content || '').toLowerCase().includes(q)
        || (a.source || '').toLowerCase().includes(q);
    });

    this.searchResults = results;
    this.articles = [...results];
    this.searchActive = true;
  }

  onSelectSuggestion(article: NewsArticle) {
    this.searchTerm = article.title;
    this.searchResults = [article];
    this.articles = [article];
    this.searchActive = true;
    this.suggestionResults = [];
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchResults = [];
    this.suggestionResults = [];
    this.searchActive = false;
    this.loadSavedNews();
  }

  // Change source filter (partial match, case-insensitive)
  onSourceFilterChange(value: string) {
    this.sourceFilter = (value || '').trim();

    if (!this.sourceFilter) {
      this.activeCategories = [];
      this.searchActive = false;
      this.articles = [...this.allFetchedNews];
      this.suggestionResults = this.allFetchedNews.slice(0, 10);
      return;
    }

    if (this.searchActive) {
      this.onSearchSubmit();
      return;
    }

    const noCategory = !this.activeCategories || this.activeCategories.length === 0;
    if (noCategory) {
      if (!this.sourceFilter) {
        this.articles = [...this.allFetchedNews];
      } else {
        const needle = this.sourceFilter.toLowerCase();
        this.articles = this.allFetchedNews.filter(a => ((a.source || '') + '').toLowerCase().includes(needle));
      }
      return;
    }

    this.articles = [...this.articles];
  }

  // Update the source search term used to filter the list of available sources
  onSourceSearchInput(value: string) {
    this.sourceSearchTerm = (value || '').trim().toLowerCase();
    this.articles = [...this.articles];
  }

  // Compute available sources from current articles (unique list)
  getAvailableSources(): string[] {
    const set = new Set<string>();
    for (const a of this.allFetchedNews) {
      const s = a.source || 'Unknown';
      if (s) set.add(s);
    }

    let sources = Array.from(set).sort();

    if (this.sourceSearchTerm && this.sourceSearchTerm.length > 0) {
      const filtered = sources.filter(s => s.toLowerCase().includes(this.sourceSearchTerm));
      return filtered;
    }

    return sources;
  }

  getArticlesByCategory(categoryId: string): NewsArticle[] {
    let list = this.articles.filter(article => article.category.id === categoryId);

    if (this.sourceFilter) {
      const needle = this.sourceFilter.toLowerCase();
      list = list.filter(a => {
        const s = (a.source || '').toString();
        return s.toLowerCase().includes(needle);
      });
    }

    list = list.sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return this.sortOrder === 'newest' ? tb - ta : ta - tb;
    });

    return list;
  }

  private loadSavedNews() {
    this.newsService.getAllSavedNews().subscribe({
      next: (articles: NewsArticle[]) => {
        this.articles = articles;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des articles sauvegardés:', error);
      }
    });
  }
}