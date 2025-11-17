# Structure de la base de données Firestore pour News IA

## Collections Principales

### 1. Articles (/articles)
```javascript
{
  id: "auto-generated-id",
  title: "Titre de l'article",
  summary: "Résumé automatique",
  content: "Contenu complet de l'article",
  category: {
    id: "technology",
    name: "technology", 
    displayName: "Technologie",
    color: "#3b82f6",
    icon: "laptop"
  },
  source: "Le Monde",
  author: "Nom de l'auteur",
  url: "https://...",
  publishedAt: "2025-11-17T10:00:00Z",
  createdAt: "2025-11-17T10:00:00Z", 
  updatedAt: "2025-11-17T10:00:00Z",
  status: "published", // draft, published, archived
  aiGenerated: false,
  imageUrl: "https://...",
  tags: ["tech", "IA", "startup"],
  keywords: ["intelligence artificielle", "technologie"],
  sentiment: "positive", // positive, negative, neutral
  views: 152,
  popularity: 0.85 // Score de fiabilité/popularité
}
```

### 2. Catégories (/categories)
```javascript
{
  id: "technology",
  name: "technology",
  displayName: "Technologie", 
  color: "#3b82f6",
  icon: "laptop",
  description: "Actualités technologiques et innovations",
  articleCount: 42
}
```

### 3. Analyses IA (/ai_analyses)
```javascript
{
  id: "auto-generated-id",
  articleId: "article-id-reference",
  summary: "Résumé généré par IA",
  keyPoints: ["Point clé 1", "Point clé 2"],
  keywords: ["mot-clé 1", "mot-clé 2"],
  sentiment: "positive",
  sentimentScore: 0.75,
  confidence: 0.92,
  relatedTopics: ["IA", "innovation"],
  processedAt: "2025-11-17T10:00:00Z",
  processingTime: 1250, // en ms
  success: true,
  errorMessage: null,
  
  // Détection fake news
  fakeNewsScore: 0.85,
  fakeNewsFactors: ["Source fiable", "Contenu détaillé"],
  reliable: true,
  
  // Classification
  suggestedCategory: "technology",
  categoryConfidence: 0.88,
  alternativeCategories: [
    {category: "science", confidence: 0.45},
    {category: "business", confidence: 0.32}
  ]
}
```

### 4. Logs de recherche (/search_logs)
```javascript
{
  id: "auto-generated-id",
  query: "intelligence artificielle",
  category: "technology",
  resultCount: 15,
  userId: "user-id-or-null",
  timestamp: "2025-11-17T10:00:00Z",
  ip: "192.168.1.1",
  createdAt: "2025-11-17T10:00:00Z"
}
```

### 5. Tests Backend (/backend-tests)
```javascript
{
  id: "auto-generated-id",
  message: "Test de connexion Firestore",
  timestamp: "2025-11-17T10:00:00Z",
  source: "backend"
}
```

## Index Firestore Recommandés

### Articles
- `status` ASC, `publishedAt` DESC
- `category.id` ASC, `publishedAt` DESC  
- `status` ASC, `views` DESC
- `status` ASC, `popularity` DESC
- `sentiment` ASC, `publishedAt` DESC

### Analyses IA
- `articleId` ASC, `processedAt` DESC
- `success` ASC, `processedAt` DESC
- `reliable` ASC, `fakeNewsScore` DESC

### Logs de recherche
- `timestamp` DESC
- `category` ASC, `timestamp` DESC
- `query` ASC, `timestamp` DESC

## Requêtes Courantes

### Récupérer les derniers articles publiés
```javascript
db.collection('articles')
  .where('status', '==', 'published')
  .orderBy('publishedAt', 'desc')
  .limit(20)
```

### Articles par catégorie
```javascript
db.collection('articles')
  .where('status', '==', 'published')
  .where('category.id', '==', 'technology')
  .orderBy('publishedAt', 'desc')
```

### Articles populaires
```javascript
db.collection('articles')
  .where('status', '==', 'published')
  .orderBy('popularity', 'desc')
  .limit(10)
```

### Recherche par sentiment
```javascript
db.collection('articles')
  .where('status', '==', 'published')
  .where('sentiment', '==', 'positive')
  .orderBy('publishedAt', 'desc')
```

### Statistiques de recherche
```javascript
db.collection('search_logs')
  .where('timestamp', '>=', last7Days)
  .orderBy('timestamp', 'desc')
```