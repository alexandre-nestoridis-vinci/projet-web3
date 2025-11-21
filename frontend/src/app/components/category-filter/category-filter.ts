import { Component, Output, EventEmitter } from '@angular/core'; // Suppression de Input
import { CommonModule } from '@angular/common';
import { NewsArticle, NewsRequest } from '../../models/news.model'; // Suppression de NewsCategory
import { BackendService } from '../../services/backend.service'; 

@Component({
  selector: 'app-category-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-filter.html',
  styleUrl: './category-filter.scss'
})
export class CategoryFilterComponent {
  
  // État pour désactiver le bouton pendant l'appel API 
  isLoadingNews = false;


  // Événement qui émet un tableau de NewsArticle
  @Output() newsGenerated = new EventEmitter<NewsArticle[]>(); 

  // Injection du BackendService
  constructor(private backendService: BackendService) { }

  // Méthode appelée lorsque l'utilisateur clique sur le bouton de génération
  generateNewsByClick(): void {
    if (this.isLoadingNews) {
      return; 
    }

    this.isLoadingNews = true; 
    
    // Création de l'objet de requête (l'argument manquant)
    const requestData: NewsRequest = {
      category: 'Informatique', // La catégorie qui vous intéresse
      limit: 5 
    };
    
    // Appel de la méthode avec l'argument obligatoire
    this.backendService.processWithAI(requestData).subscribe({
      next: (news: NewsArticle[]) => { 
        console.log('News générées par l\'IA avec succès :', news);
        this.isLoadingNews = false;
        
        // Envoie les données reçues au composant parent pour affichage
        this.newsGenerated.emit(news); 
      },
      error: (err) => {
        console.error("Erreur lors de la génération de news via l'IA :", err);
        this.isLoadingNews = false;
        
      }
    });
  }
}