// src/app/app.routes.ts
import { Routes } from '@angular/router';
// 🚩 NOUVEAU IMPORT
import { App } from './components/home-content/home-content'; 
import { ArticleDetailComponent } from './components/article-detail/article-detail';

export const routes: Routes = [
  // 🚩 La page d'accueil est maintenant gérée par le routeur
  { path: '', component: App }, 
  
  // Laissez la route de détail vide pour l'instant :
  { path: 'article/:id', component: ArticleDetailComponent }, 
  
  { path: '**', redirectTo: '' } 
];