# 🚀 Guide de déploiement Firebase (GRATUIT)

## Plan Firebase Spark (Gratuit) 💰

Le **plan Spark** de Firebase est **100% gratuit** et inclut :

- ✅ **Firebase Hosting** : 10 GB stockage + 360 MB/jour transfert
- ✅ **Firestore Database** : 50,000 lectures/jour + 20,000 écritures/jour  
- ✅ **Cloud Functions** : 2 millions d'invocations/mois ⚠️ (nécessite Blaze)
- ✅ **Authentication** : illimité

> ⚠️ **Important** : Les Cloud Functions nécessitent le plan Blaze (payant) mais avec quota gratuit généreux !

## 🎯 Stratégie de déploiement

### Option 1 : Frontend seulement (100% gratuit)
```bash
# Frontend Angular sur Firebase Hosting
cd frontend
ng build --prod
firebase deploy --only hosting
```
→ **URL** : https://news-app-api-vinci.web.app

### Option 2 : Full-stack avec plan Blaze
```bash
# Backend + Frontend 
cd backend
firebase deploy --only functions

cd ../frontend  
ng build --prod
firebase deploy --only hosting
```

## 📋 Étapes de déploiement

### 1. Préparer le build de production
```bash
cd frontend
npm run build
```

### 2. Vérifier la configuration
```typescript
// Assurer que environment.prod.ts pointe vers la production
useEmulators: false,
api: {
  baseUrl: "https://us-central1-news-app-api-vinci.cloudfunctions.net"
}
```

### 3. Déployer le frontend
```bash
firebase login
firebase use news-app-api-vinci  
firebase deploy --only hosting
```

### 4. (Optionnel) Déployer les functions
```bash
cd backend
firebase deploy --only functions
```

## 💡 Alternatives gratuites pour l'API

Si vous ne voulez pas payer pour les Cloud Functions :

### Vercel Functions (gratuit)
```bash
npm i -g vercel
vercel --prod
```

### Netlify Functions (gratuit) 
```bash
npm i -g netlify-cli
netlify deploy --prod
```

### Render.com (gratuit)
- Déploiement direct depuis GitHub
- Functions Node.js gratuites

## 🔧 Configuration finale

### Variables d'environnement production
```bash
# Créer les vraies clés API
NEWS_API_KEY=your_real_news_api_key
OPENAI_API_KEY=your_real_openai_key
```

### Sécurité Firestore
```javascript
// firestore.rules pour production
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /news/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /categories/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 📊 Monitoring des quotas

Dashboard Firebase : https://console.firebase.google.com/project/news-app-api-vinci/usage

- Hosting : 10 GB / mois
- Firestore : 50k lectures / jour
- Bandwidth : 360 MB / jour

## 🎓 Tips pour projet étudiant

1. **Hosting gratuit** : Firebase, Vercel, Netlify
2. **Database gratuite** : Firestore Spark, MongoDB Atlas
3. **API gratuite** : NewsAPI (500 req/jour), OpenAI credits étudiants
4. **Domaine gratuit** : .web.app ou .netlify.app

---
**Total coût minimum** : **0€** (avec limitations raisonnables)
**Parfait pour un projet étudiant !** 🎓