import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ArticlesService } from '../../services/articles.service';
import { CategoryStats, AIStats } from '../../models/news.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  
  // Statistiques
  categoryStats: CategoryStats[] = [];
  aiStats: AIStats | null = null;
  loading = false;
  error: string | null = null;

  // Données du dashboard
  totalArticles = 0;
  totalViews = 0;
  averageSentiment = 'neutral';
  
  constructor(private articlesService: ArticlesService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  // 📊 Charger les données du dashboard
  loadDashboardData() {
    this.loading = true;
    this.error = null;

    // Charger les statistiques des catégories
    this.articlesService.getCategoryStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.categoryStats = response.data || [];
          this.calculateTotalArticles();
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des stats catégories:', error);
      }
    });

    // Charger les statistiques IA
    this.articlesService.getAIStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.aiStats = response.data;
          this.calculateAverages();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des stats IA:', error);
        this.loading = false;
      }
    });
  }

  // 🧮 Calculer le total des articles
  calculateTotalArticles() {
    this.totalArticles = this.categoryStats.reduce((sum, stat) => sum + stat.articleCount, 0);
  }

  // 📈 Calculer les moyennes
  calculateAverages() {
    if (this.aiStats) {
      // Simuler des calculs de moyennes
      this.totalViews = this.aiStats.totalAnalyses * 15; // Estimation
      
      // Déterminer le sentiment moyen
      const { positive, negative, neutral } = this.aiStats.sentimentDistribution;
      if (positive > negative && positive > neutral) {
        this.averageSentiment = 'positive';
      } else if (negative > positive && negative > neutral) {
        this.averageSentiment = 'negative';
      } else {
        this.averageSentiment = 'neutral';
      }
    }
  }

  // 🎨 Obtenir la couleur d'une catégorie
  getCategoryColor(categoryId: string): string {
    const colors: { [key: string]: string } = {
      'technologie': '#3b82f6',
      'sport': '#10b981',
      'politique': '#f59e0b',
      'economie': '#8b5cf6',
      'sante': '#ef4444',
      'environnement': '#06b6d4',
      'culture': '#f97316'
    };
    return colors[categoryId] || '#6b7280';
  }

  // 😊 Obtenir l'emoji du sentiment
  getSentimentEmoji(sentiment?: string): string {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      case 'neutral': return '😐';
      default: return '😐';
    }
  }

  // 🔄 Actualiser les données
  refresh() {
    this.loadDashboardData();
  }

  // 📊 Calculer le pourcentage
  getPercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }
}