# 📰 News IA - Application d'actualités intelligentes

Application web moderne de consultation d'actualités avec génération automatique via intelligence artificielle (Gemini).

## 🎯 Description

Application full-stack permettant de :
- ✅ **Générer automatiquement** des actualités via l'API Gemini AI
- ✅ **Stocker et organiser** les articles par catégorie (informatique, sport, politique, économie...)
- ✅ **Analyser le sentiment** de chaque article (positif, négatif, neutre)
- ✅ **Extraire des mots-clés** et générer des résumés automatiquement
- ✅ **Déduplication intelligente** pour éviter les doublons

## 🏗️ Architecture Technique

### Frontend (Angular 18)
- Interface utilisateur moderne et responsive
- Affichage des articles par catégorie
- Système de commentaires
- Intégration temps réel avec Firestore

### Backend (Firebase Cloud Functions)
- **API REST** avec 7 endpoints
- **Gemini AI** pour génération de contenu
- **Firestore** pour stockage NoSQL
- **Analyse de sentiment** automatique
- **Cache intelligent** (1h par catégorie)

## 📡 API Endpoints

**Base URL (dev):** `http://127.0.0.1:5001/news-app-api-vinci/us-central1/api/api`

### Endpoints disponibles
```
GET  /health                    # Health check
POST /fetch-ai-news             # Génération de news via Gemini AI ⭐
GET  /news                      # Liste tous les articles (filtrable)
GET  /articles/:id              # Détail d'un article
POST /articles/:id/comments     # Ajouter un commentaire
GET  /articles/:id/comments     # Récupérer les commentaires
```

### Exemple d'utilisation
```bash
# Générer 25 news d'informatique
POST /api/fetch-ai-news
{
  "category": "informatique",
  "limit": 25,
  "forceRefresh": true
}

# Récupérer les articles
GET /api/news?category=informatique&limit=20
```

## 🤖 Intelligence Artificielle

### Gemini 2.5 Flash
- Génération de 5-25 articles par requête
- Prompts optimisés pour news françaises des 2 derniers mois
- Sources réelles (Le Monde Informatique, ZDNet, Silicon...)
- Timeout de 30 secondes pour gérer les délais
- Fallback OpenAI si Gemini échoue

### Analyse automatique
Chaque article est enrichi avec :
- **Sentiment** : positive | neutral | negative
- **Mots-clés** : extraction automatique (top 5)
- **Résumé** : génération jusqu'à 200 caractères

## 🗄️ Base de données (Firestore)

### Collections
```
articles/
  ├── {id}
      ├── title: string
      ├── description: string
      ├── content: string
      ├── url: string
      ├── source: {name, url}
      ├── category: string
      ├── sentiment: string
      ├── keywords: string[]
      ├── summary: string
      ├── dedupHash: string (MD5)
      ├── publishedAt: timestamp
      └── fetchedAt: timestamp

articles/{id}/comments/
  ├── {commentId}
      ├── author: string
      ├── content: string
      └── createdAt: timestamp
```

## 🚀 Installation et démarrage

### Prérequis
- Node.js 20.19+ ou 22.12+
- Firebase CLI
- Clé API Gemini (gratuite)

### Setup rapide
```bash
# Clone du projet
git clone https://github.com/alexandre-nestoridis-vinci/projet-web3.git
cd projet-web3

# Installation automatique
npm run setup

# Démarrage
npm run dev
```

### Configuration Gemini
```bash
cd backend/functions
echo "GEMINI_API_KEY=your_key_here" > .env
```

## 🔧 Développement

### Frontend (port 4200)
```bash
npm run dev:frontend
```

### Backend (port 5001)
```bash
npm run dev:backend
```

### Tests
```bash
# Backend
cd backend/functions
npm test

# Frontend
cd frontend
ng test
```

## 📊 Fonctionnalités clés

### Cache intelligent
- Durée : 1 heure par catégorie
- Évite les appels API inutiles
- Option `forceRefresh` pour bypass

### Déduplication
- Hash MD5 basé sur URL + titre
- Vérification avant insertion
- Mise à jour automatique du `fetchedAt` si doublon

### Gestion d'erreurs
- Triple fallback : Gemini → OpenAI → Tableau vide
- Logs détaillés pour debugging
- Messages d'erreur explicites

## 🛠️ Technologies utilisées

### Backend
- **Firebase Cloud Functions** (serverless)
- **Firestore** (NoSQL)
- **Express.js** (API REST)
- **TypeScript** (typage strict)
- **Gemini AI** (génération contenu)
- **Axios** (requêtes HTTP)

### Frontend
- **Angular 18** (framework)
- **AngularFire** (intégration Firebase)
- **RxJS** (programmation réactive)
- **TypeScript**

### Outils
- **ESLint** (qualité code - 0 erreur)
- **Firebase Emulator** (dev local)
- **Git** (versioning)

## 📈 Performances

- ⚡ **Cache 1h** : réduit les appels API
- 🔒 **Déduplication** : évite les doublons
- 🚀 **Serverless** : scalabilité automatique
- 💾 **Firestore** : requêtes optimisées (index)

---

**Projet** : Cours Web3 - VINCI  
**Stack** : Angular + Firebase + Gemini AI  
**Équipe** : 5 développeurs
