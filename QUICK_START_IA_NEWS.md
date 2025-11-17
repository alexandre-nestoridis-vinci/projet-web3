# 📰 Backend News avec IA - Résumé Configuration

## ✅ Qu'est-ce qui a été implémenté?

1. **Nouveau endpoint API** - `POST /api/fetch-ai-news`
   - Récupère les news réelles via une IA
   - Stocke automatiquement dans Firestore
   - Cache de 1h pour éviter les appels répétés

2. **Support de 2 IA** (au choix):
   - **Gemini** (Google) - Gratuit ⭐ Recommandé
   - **OpenAI** (ChatGPT) - Payant mais meilleure qualité

3. **Système de cache intégré**
   - Cache 1h par catégorie
   - Refuse les appels répétés avec message clair
   - Force refresh possible

---

## 🚀 Quick Start - 3 étapes

### Étape 1: Obtenir une clé API (5 min)

**Option A: Google Gemini (GRATUIT)**
1. Va sur https://ai.google.dev
2. Clique "Get API Key"
3. Sélectionne "Create API key in new project"
4. Copie la clé

**Option B: OpenAI ($5 crédits gratuits)**
1. Va sur https://platform.openai.com
2. Sign up / Login
3. Clique "API keys" (gauche)
4. "Create new secret key"

### Étape 2: Configurer le .env (2 min)

```bash
cd C:\VINCI\projet-web3\backend\functions
```

Crée ou modifie `.env`:
```
GEMINI_API_KEY=ta_clé_ici
# OU
OPENAI_API_KEY=sk_ta_clé_ici
```

### Étape 3: Tester (1 min)

Terminal 1:
```powershell
cd C:\VINCI\projet-web3
npm run dev:backend
# Attend "All emulators ready!"
```

Terminal 2:
```powershell
$baseUrl = "http://localhost:5001/news-app-api-vinci/europe-west1/api"

# Récupérer les news informatique
$response = Invoke-RestMethod -Uri "$baseUrl/api/fetch-ai-news" -Method POST `
  -Body (@{category="informatique"}|ConvertTo-Json) `
  -ContentType "application/json"

$response | ConvertTo-Json -Depth 2
```

---

## 📊 Réponse attendue

**Premier appel (succès):**
```json
{
  "ok": true,
  "message": "3 nouvelle(s) news ajoutée(s) pour \"informatique\"",
  "addedCount": 3,
  "articles": [
    {
      "title": "Titre de l'actualité",
      "description": "...",
      "content": "...",
      "sentiment": "positive",
      "keywords": ["ia", "tech", "..."]
    }
  ]
}
```

**Appel dans l'heure (cache actif):**
```json
{
  "ok": false,
  "message": "Les news ont déjà été récupérées il y a moins d'1h. Réessaie plus tard."
}
```

---

## 🔓 Forcer la récupération

Ajoute `forceRefresh: true`:
```powershell
$body = @{
  category = "informatique"
  forceRefresh = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/fetch-ai-news" -Method POST `
  -Body $body -ContentType "application/json"
```

---

## 📁 Fichiers créés/modifiés

- ✅ `src/aiNewsService.ts` - Nouvelle logique IA
- ✅ `src/index.ts` - Nouvel endpoint
- ✅ `AI_NEWS_SETUP.md` - Documentation complète
- ✅ `functions/.env.example` - Template config

---

## 🎯 Prochaines étapes pour le frontend

1. Créer un bouton "Actualiser les news" par catégorie
2. Afficher la date de dernière mise à jour
3. Afficher un message "Aucune nouvelle news" si cache actif
4. Gérer les catégories multiples

---

## ⚡ Performance

- **Gemini**: ~2-5 secondes (gratuit)
- **OpenAI**: ~1-3 secondes (payant)
- **Cache**: 1h = ~720 appels max/jour par catégorie

---

## 🐛 Aide

Si tu as des erreurs:
1. Vérifies que ta clé API est correcte
2. Essaie l'autre IA si l'une échoue
3. Utilise `forceRefresh: true` pour ignorer le cache

Tout est dans `AI_NEWS_SETUP.md` pour plus de détails!
