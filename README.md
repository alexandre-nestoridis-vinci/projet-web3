# 📰 Projet News avec IA - VINCI

Site d'actualités avec moteur IA intégré pour analyse et recommandations.

## 🏗️ Architecture

```
projet-web3/
├── frontend/     # Angular 18 (Interface utilisateur)
└── backend/      # Firebase Functions (API + IA)
```

## 🚀 Installation ULTRA-RAPIDE (1 commande)

### ⚠️ Prérequis
- **Node.js 20.19+** ou **22.12+** (requis pour Angular)
- Git installé

### 🎯 Setup automatique complet
```bash
git clone https://github.com/alexandre-nestoridis-vinci/projet-web3.git
cd projet-web3

# Windows
.\setup.bat

# Linux/Mac  
chmod +x setup.sh && ./setup.sh

# Alternative Node.js (multi-plateforme)
npm run setup
```

### 🔥 Démarrage développement
```bash
# Tout en 1 (Frontend + Backend)
npm run dev

# Ou séparément:
npm run dev:frontend  # Angular sur :4200
npm run dev:backend   # Firebase sur :5001
```

### 🚀 Déploiement

**Option 1 - Manuel (immédiat) :**
```bash
cd frontend && npm run build
firebase deploy --only hosting
```

**Option 2 - Automatique :**
```bash
# Voir CI-CD-SETUP.md pour configuration
git push origin main  # → https://news-app-api-vinci.web.app
```

## 🛠️ Développement

### Frontend (Angular)
- **Port**: 4200
- **Commandes**: `ng serve`, `ng build`, `ng test`
- **Dossier**: `/frontend/src/app/`

### Backend (Firebase Functions) 
- **Port**: 5001 (émulé)
- **Commandes**: `firebase emulators:start`
- **Dossier**: `/backend/functions/src/`

### API Endpoints disponibles
- `GET /testFirestore` - Test connexion base
- `GET /fetchNews` - Récupération actualités  
- `POST /processWithAI` - Traitement IA

## 👥 Répartition équipe (suggestion)

1. **Frontend Components** - Personne A
2. **Service Angular + API** - Personne B  
3. **Backend Functions** - Personne C
4. **IA Integration** - Personne D
5. **UI/UX + Tests** - Personne E

## 📦 Dépendances principales

### Frontend
- Angular 18
- @angular/fire
- Bootstrap/Angular Material

### Backend  
- firebase-functions
- firebase-admin
- Intégration IA (OpenAI/Claude)

## 🔥 Firebase Configuration

**Projet**: `news-app-api-vinci`

### Variables d'environnement
```typescript
// frontend/src/environments/environment.ts
export const environment = {
  production: false,
  useEmulators: true, // LOCAL DEV
  firebase: { /* config */ }
};
```

## 📝 TODO Liste

- [ ] Interface composants Angular
- [ ] Service récupération news  
- [ ] API endpoints backend
- [ ] Intégration moteur IA
- [ ] Tests unitaires
- [ ] Déploiement Firebase

## 🆘 Problèmes fréquents

### "firebase.json not found"
→ Vérifier d'être dans `/backend/` pour les commandes Firebase

### Ports occupés  
→ Changer ports dans `firebase.json` si conflits

### npm install fails
→ Supprimer `node_modules/` et `package-lock.json`, relancer

---
**Deadline**: Vendredi prochain 📅
**Équipe**: 5 développeurs
