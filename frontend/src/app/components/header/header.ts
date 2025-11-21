import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../services/firebase';
import { BackendService } from '../../services/backend.service';
import { NewsArticle, NewsCategory } from '../../models/news.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  greeting = 'Salam! 👋';
  title = 'News AI';
  subtitle = 'Actualités intelligentes avec IA';

  constructor(
    private firebaseService: FirebaseService,
    private backendService: BackendService
  ) {}

  testFirestore() {
    console.log('🔥 Test de connexion Firestore...');
    
    // Créer un article de test
    const testArticle: NewsArticle = {
      id: '',
      title: 'Article de test Firestore',
      summary: 'Ceci est un test de connexion à Firestore depuis Angular',
      content: 'Contenu complet de l\'article de test pour vérifier la sauvegarde en base de données.',
      category: {
        id: 'test',
        name: 'test',
        displayName: 'Test',
        color: '#3b82f6',
        icon: 'laptop'
      },
      source: 'Test Firebase',
      url: 'https://example.com',
      publishedAt: new Date(),
      aiGenerated: true,
      tags: ['test', 'firebase', 'firestore'],
      sentiment: 'positive'
    };

    // Sauvegarder l'article
    this.firebaseService.saveNewsArticle(testArticle).subscribe({
      next: (docId) => {
        console.log('✅ Article sauvegardé avec succès! ID:', docId);
        alert('🎉 Connexion Firestore réussie! Article sauvegardé.');
      },
      error: (error) => {
        console.error('❌ Erreur Firestore:', error);
        alert('❌ Erreur de connexion Firestore. Vérifiez la console.');
      }
    });
  }

  // 🚀 Test du backend API (via émulateurs)
  testBackendAPI() {
    console.log('🚀 Test de l\'API Backend...');
    
    this.backendService.testFirestore().subscribe({
      next: (result) => {
        console.log('✅ API Backend réussie!', result);
        alert(`🎉 Backend connecté! ${result.message}`);
      },
      error: (error) => {
        console.error('❌ Erreur API Backend:', error);
        alert('❌ Erreur connexion Backend. Vérifiez que les émulateurs sont démarrés.');
      }
    });
  }
}
