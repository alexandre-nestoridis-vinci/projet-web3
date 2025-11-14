import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, orderBy, limit } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { NewsArticle, NewsCategory } from '../models/news.model';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {

  constructor(private firestore: Firestore) { }

  // Sauvegarder un article de news
  saveNewsArticle(article: NewsArticle): Observable<string> {
    const newsCollection = collection(this.firestore, 'news');
    return from(addDoc(newsCollection, article).then(docRef => docRef.id));
  }

  // Récupérer les articles par catégorie
  getNewsByCategory(category: string, limitCount = 10): Observable<NewsArticle[]> {
    const newsCollection = collection(this.firestore, 'news');
    const q = query(
      newsCollection, 
      where('category.name', '==', category),
      orderBy('publishedAt', 'desc'),
      limit(limitCount)
    );
    
    return from(getDocs(q).then(snapshot => 
      snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsArticle))
    ));
  }

  // Récupérer tous les articles récents
  getRecentNews(limitCount = 20): Observable<NewsArticle[]> {
    const newsCollection = collection(this.firestore, 'news');
    const q = query(
      newsCollection,
      orderBy('publishedAt', 'desc'),
      limit(limitCount)
    );
    
    return from(getDocs(q).then(snapshot => 
      snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsArticle))
    ));
  }

  // Sauvegarder les catégories
  saveCategories(categories: NewsCategory[]): Observable<void> {
    const categoriesCollection = collection(this.firestore, 'categories');
    const promises = categories.map(category => addDoc(categoriesCollection, category));
    return from(Promise.all(promises).then(() => void 0));
  }
}
