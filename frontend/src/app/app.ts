import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header';
import { NewsSectionComponent } from './components/news-section/news-section';
import { CategoryFilterComponent } from './components/category-filter/category-filter';
import { NewsCardComponent } from './components/news-card/news-card';
import { NewsService } from './services/news';
import { BackendService } from './services/backend.service';
import { NewsArticle, NewsCategory } from './models/news.model';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, 
    CommonModule,
    HeaderComponent, 
    NewsSectionComponent, 
    CategoryFilterComponent
    , NewsCardComponent
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
  // Filtre: tri par date (newest | oldest)
  sortOrder: 'newest' | 'oldest' = 'newest';
  // Filtre: source (vide = toutes les sources)
  sourceFilter: string = '';
  // Barre de recherche
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

    // try to find matching category from existing categories
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

  ngOnInit() {
    this.categories = this.newsService.getCategories();
    // Par défaut aucune catégorie sélectionnée — afficher toutes les news existantes
    this.activeCategories = [];
      // Charger toutes les news existantes pour l'affichage initial via NewsService
      this.newsService.fetchExistingNews(undefined, 200).subscribe({
        next: (articles: NewsArticle[]) => {
          this.allFetchedNews = articles;
          this.articles = articles;
          this.suggestionResults = articles.slice(0, 10);
        },
        error: (err: any) => {
          console.error('Erreur load initiale fetchExistingNews:', err);
          // fallback to previously saved news
          this.loadAllNews(200);
        }
      });
  }

  onCategorySelected(category: NewsCategory) {
    this.isLoading = true;

    // set active category so UI shows category sections instead of global list
    this.activeCategories = [category];

    // Use fetchExistingNews to retrieve persisted articles for the category (do not create)
      if (typeof (this.newsService as any).fetchExistingNews === 'function') {
        // backend stored categories use the full name (e.g. 'technology'), so pass category.name
        (this.newsService as any).fetchExistingNews(category.name, 10).subscribe({
        next: (articles: NewsArticle[]) => {
          // replace articles with the category results (do not append)
          if (!articles || articles.length === 0) {
            // fallback to mock for this specific category
            if (typeof (this.newsService as any).generateMockForCategory === 'function') {
              this.articles = (this.newsService as any).generateMockForCategory(category.id, 10);
            } else {
              this.articles = [];
            }
          } else {
            this.articles = [...articles];
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des news (existing):', error);
          // on erreur, fallback to mock for category
          if (typeof (this.newsService as any).generateMockForCategory === 'function') {
            this.articles = (this.newsService as any).generateMockForCategory(category.id, 10);
          } else {
            this.articles = [];
          }
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
          // replace articles with the category results (do not append)
          this.articles = [...articles];
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement desnews:', error);
          this.isLoading = false;
        }
      });
    }
  }

  // Change sort order (triggered depuis the template)
  // Accept a generic string from the template and normalize to the union type
  onSortChange(order: string) {
    if (order === 'newest' || order === 'oldest') {
      this.sortOrder = order;
    } else {
      // fallback safe value
      this.sortOrder = 'newest';
    }
  }

  // Search bar handlers
  onSearchFocus() {
    // Load all news for suggestions if not already loaded
    if (this.allFetchedNews.length === 0) {
      // prefer NewsService.fetchExistingNews for retrieval
      if (typeof (this.newsService as any).fetchExistingNews === 'function') {
        // ensure we pass (category, limit) signature - here we want no category, only limit
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
          this.articles = articles;
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
          this.articles = mapped;
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
      // if empty and no category selected and no source filter -> show all existing
      const noCategory = !this.activeCategories || this.activeCategories.length === 0;
      const noSourceFilter = !this.sourceFilter || this.sourceFilter.trim() === '';

      if (noCategory && noSourceFilter) {
        // show all articles
        this.searchResults = this.allFetchedNews;
        this.articles = [...this.allFetchedNews];
        this.searchActive = true;
        this.suggestionResults = [];
      } else {
        // keep normal behavior (don't switch to global search view)
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
    // reload saved news
    this.loadSavedNews();
  }

  // Change source filter (partial match, case-insensitive)
  onSourceFilterChange(value: string) {
    this.sourceFilter = (value || '').trim();
  }

  // Compute available sources from current articles (unique list)
  getAvailableSources(): string[] {
    const set = new Set<string>();
    for (const a of this.articles) {
      const s = a.source || 'Unknown';
      if (s) set.add(s);
    }
    return Array.from(set).sort();
  }

  getArticlesByCategory(categoryId: string): NewsArticle[] {
    let list = this.articles.filter(article => article.category.id === categoryId);

    // Apply source filter (if any)
    if (this.sourceFilter) {
      const needle = this.sourceFilter.toLowerCase();
      list = list.filter(a => {
        const s = (a.source || '').toString();
        return s.toLowerCase().includes(needle);
      });
    }

    // Sort by publishedAt
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
