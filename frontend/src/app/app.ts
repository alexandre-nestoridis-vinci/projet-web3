import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header';
import { NewsSectionComponent } from './components/news-section/news-section';
import { CategoryFilterComponent } from './components/category-filter/category-filter';
import { NewsService } from './services/news';
import { NewsArticle, NewsCategory } from './models/news.model';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, 
    CommonModule,
    HeaderComponent, 
    NewsSectionComponent, 
    CategoryFilterComponent
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

  constructor(private newsService: NewsService) {}

  ngOnInit() {
    this.categories = this.newsService.getCategories();
    this.activeCategories = this.categories.slice(0, 3); // Afficher 3 catégories par défaut
    this.loadSavedNews();
  }

  onCategorySelected(category: NewsCategory) {
    this.isLoading = true;
    
    this.newsService.fetchTodaysNews({
      category: category.id,
      limit: 10,
      language: 'fr'
    }).subscribe({
      next: (articles) => {
        this.articles = [...this.articles, ...articles];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des news:', error);
        this.isLoading = false;
      }
    });
  }

  getArticlesByCategory(categoryId: string): NewsArticle[] {
    return this.articles.filter(article => article.category.id === categoryId);
  }

  private loadSavedNews() {
    this.newsService.getAllSavedNews().subscribe({
      next: (articles) => {
        this.articles = articles;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des articles sauvegardés:', error);
      }
    });
  }
}
