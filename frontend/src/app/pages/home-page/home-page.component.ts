import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ArticlesService } from '../../services/articles.service';
import { NewsArticle, NewsRequest, CategoryStats, NewsCategory } from '../../models/news.model';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnInit {
  
  // Articles et données
  articles: NewsArticle[] = [];
  filteredArticles: NewsArticle[] = [];
  categoryStats: CategoryStats[] = [];
  loading = false;
  error: string | null = null;

  // Filtres
  selectedCategory = '';
  selectedSource = '';
  selectedSort: 'publishedAt' | 'popularity' | 'views' = 'publishedAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  dateFrom: string = '';
  dateTo: string = '';

  // Recherche
  searchQuery = '';
  searchSuggestions: string[] = [];
  showSuggestions = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalItems = 0;

  // Catégories disponibles
  categories = [
    { id: '', name: 'Toutes les catégories', displayName: 'Toutes', color: '#6b7280' },
    { id: 'technologie', name: 'Technologie', displayName: 'Tech', color: '#3b82f6' },
    { id: 'sport', name: 'Sport', displayName: 'Sport', color: '#10b981' },
    { id: 'politique', name: 'Politique', displayName: 'Politique', color: '#f59e0b' },
    { id: 'economie', name: 'Économie', displayName: 'Économie', color: '#8b5cf6' },
    { id: 'sante', name: 'Santé', displayName: 'Santé', color: '#ef4444' },
    { id: 'environnement', name: 'Environnement', displayName: 'Environnement', color: '#06b6d4' },
    { id: 'culture', name: 'Culture', displayName: 'Culture', color: '#f97316' }
  ];

  // Sources disponibles
  sources: string[] = [];

  constructor(private articlesService: ArticlesService) {}

  ngOnInit() {
    this.loadArticles();
    this.loadCategoryStats();
  }

  // 📰 Charger les articles
  loadArticles() {
    this.loading = true;
    this.error = null;

    const request: NewsRequest = {
      category: this.selectedCategory || undefined,
      limit: this.itemsPerPage,
      offset: (this.currentPage - 1) * this.itemsPerPage,
      sortBy: this.selectedSort,
      sortOrder: this.sortOrder,
      source: this.selectedSource || undefined,
      dateFrom: this.dateFrom ? new Date(this.dateFrom) : undefined,
      dateTo: this.dateTo ? new Date(this.dateTo) : undefined,
    };

    this.articlesService.getArticles(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.articles = response.data || [];
          this.filteredArticles = [...this.articles];
          this.totalItems = response.total || this.articles.length;
          
          // Extraire les sources uniques
          this.extractUniqueSources();
        } else {
          this.error = 'Erreur lors du chargement des articles';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.error = 'Erreur de connexion';
        this.loading = false;
      }
    });
  }

  // 📊 Charger les statistiques des catégories
  loadCategoryStats() {
    this.articlesService.getCategoryStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.categoryStats = response.data || [];
        }
      },
      error: (error) => {
        console.error('Erreur statistiques:', error);
      }
    });
  }

  // 🔍 Recherche d'articles
  onSearch() {
    if (this.searchQuery.trim()) {
      this.loading = true;
      this.articlesService.searchArticles(
        this.searchQuery, 
        this.selectedCategory || undefined, 
        50
      ).subscribe({
        next: (response) => {
          if (response.success) {
            this.articles = response.data || [];
            this.filteredArticles = [...this.articles];
            this.totalItems = this.articles.length;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur recherche:', error);
          this.error = 'Erreur lors de la recherche';
          this.loading = false;
        }
      });
    } else {
      this.loadArticles();
    }
  }

  // 💡 Suggestions de recherche
  onSearchInput() {
    if (this.searchQuery.length >= 2) {
      this.articlesService.getSearchSuggestions(this.searchQuery, 5).subscribe({
        next: (response) => {
          if (response.success) {
            this.searchSuggestions = response.data || [];
            this.showSuggestions = this.searchSuggestions.length > 0;
          }
        },
        error: (error) => {
          console.error('Erreur suggestions:', error);
        }
      });
    } else {
      this.searchSuggestions = [];
      this.showSuggestions = false;
    }
  }

  // 🎯 Utiliser une suggestion
  useSuggestion(suggestion: string) {
    this.searchQuery = suggestion;
    this.showSuggestions = false;
    this.onSearch();
  }

  // 🏷️ Filtrer par catégorie
  filterByCategory(categoryId: string) {
    this.selectedCategory = categoryId;
    this.currentPage = 1;
    this.loadArticles();
  }

  // 📅 Appliquer les filtres
  applyFilters() {
    this.currentPage = 1;
    this.loadArticles();
  }

  // 🔄 Réinitialiser les filtres
  resetFilters() {
    this.selectedCategory = '';
    this.selectedSource = '';
    this.selectedSort = 'publishedAt';
    this.sortOrder = 'desc';
    this.dateFrom = '';
    this.dateTo = '';
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadArticles();
  }

  // 📄 Pagination
  nextPage() {
    if (this.currentPage * this.itemsPerPage < this.totalItems) {
      this.currentPage++;
      this.loadArticles();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadArticles();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadArticles();
  }

  // 📊 Obtenir le nombre total de pages
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  // 📋 Pages visibles pour la pagination
  get visiblePages(): number[] {
    const pages = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // 🎨 Obtenir les infos d'une catégorie
  getCategoryInfo(category: NewsCategory | string): any {
    if (typeof category === 'string') {
      const found = this.categories.find(c => c.id === category);
      return found || { displayName: category, color: '#6b7280' };
    }
    return {
      displayName: category.displayName || category.name,
      color: category.color || '#6b7280'
    };
  }

  // 📈 Obtenir le compteur d'articles pour une catégorie
  getCategoryCount(categoryId: string): number {
    const stat = this.categoryStats.find(s => s.categoryId === categoryId);
    return stat?.articleCount || 0;
  }

  // 🔍 Extraire les sources uniques des articles
  private extractUniqueSources() {
    const uniqueSources = new Set<string>();
    this.articles.forEach(article => {
      if (article.source) {
        uniqueSources.add(article.source);
      }
    });
    this.sources = Array.from(uniqueSources).sort();
  }

  // 📅 Formater une date
  formatDate(date: Date): string {
    if (!date) return '';
    
    const now = new Date();
    const diffInHours = (now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Il y a quelques minutes';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }

  // 😊 Obtenir l'emoji du sentiment
  getSentimentEmoji(sentiment?: string): string {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      case 'neutral': return '😐';
      default: return '';
    }
  }

  // 🎯 Obtenir la classe CSS du sentiment
  getSentimentClass(sentiment?: string): string {
    switch (sentiment) {
      case 'positive': return 'positive';
      case 'negative': return 'negative';
      case 'neutral': return 'neutral';
      default: return 'neutral';
    }
  }

  // 🏷️ Pour le trackBy dans ngFor
  trackByArticleId(index: number, article: NewsArticle): string {
    return article.id;
  }
}