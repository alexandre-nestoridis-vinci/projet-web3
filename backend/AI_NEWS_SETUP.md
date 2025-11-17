# Configuration API pour les News avec IA

## ⚙️ Configuration requise

### 1. **Google Gemini (GRATUIT - Recommandé)**

**Étapes:**
1. Aller sur https://ai.google.dev
2. Cliquer "Get API Key"
3. Créer un nouveau projet
4. Générer une clé API

**Configuration:**
```bash
# Dans le fichier .env du dossier backend/functions
GEMINI_API_KEY=votre_clé_ici
```

**Avantages:**
- ✅ Complètement gratuit
- ✅ 60 appels/min (suffisant)
- ✅ Facile à configurer
- ✅ Pas de carte de crédit

---

### 2. **OpenAI (Alternative - $5 crédits gratuits)**

**Étapes:**
1. Aller sur https://platform.openai.com
2. Sign up
3. Aller dans "API keys"
4. Créer une nouvelle clé

**Configuration:**
```bash
# Dans le fichier .env du dossier backend/functions
OPENAI_API_KEY=sk-...
```

**Avantages:**
- ✅ Meilleure qualité de réponses
- ✅ $5 de crédits d'essai gratuits
- ✅ GPT-3.5-turbo très bon marché

---

## 📝 Comment utiliser les endpoints

### Endpoint 1: Récupérer les news via IA
```bash
POST http://localhost:5001/news-app-api-vinci/europe-west1/api/api/fetch-ai-news

Body:
{
  "category": "informatique",
  "forceRefresh": false
}
```

**Réponse (succès):**
```json
{
  "ok": true,
  "message": "3 nouvelle(s) news ajoutée(s) pour \"informatique\"",
  "addedCount": 3,
  "articles": [...]
}
```

**Réponse (cache actif - < 1h):**
```json
{
  "ok": false,
  "message": "Les news ont déjà été récupérées il y a moins d'1h. Réessaie plus tard."
}
```

### Endpoint 2: Forcer la récupération (ignorer cache)
```bash
POST http://localhost:5001/news-app-api-vinci/europe-west1/api/api/fetch-ai-news

Body:
{
  "category": "informatique",
  "forceRefresh": true
}
```

---

## 🧪 Test en PowerShell

```powershell
$baseUrl = "http://localhost:5001/news-app-api-vinci/europe-west1/api"

# Récupérer les news
$response = Invoke-RestMethod -Uri "$baseUrl/api/fetch-ai-news" -Method POST `
  -Body (@{category="informatique"}|ConvertTo-Json) `
  -ContentType "application/json"

$response | ConvertTo-Json -Depth 2
```

---

## 📋 Catégories supportées

Pour le moment, utilise ces catégories:
- `informatique`
- `technologie`
- `tech`
- `ai`
- `science`
- `sport`
- `politique`
- `economie`

---

## ⏱️ Système de cache

- **Durée du cache:** 1 heure
- **Comportement:** Si tu appelles le même endpoint dans l'heure, il refuse et dit "news déjà récupérées"
- **Forcer:** Utilise `forceRefresh: true` pour ignorer le cache

---

## 🚀 Déploiement en production

Ajoute les variables d'environnement dans Firebase:
```bash
firebase functions:config:set gemini.key="votre_clé_ici"
# ou
firebase functions:config:set openai.key="sk-..."
```

Puis dans le code:
```typescript
const GEMINI_API_KEY = functions.config().gemini?.key || process.env.GEMINI_API_KEY;
```

---

## 🐛 Troubleshooting

**Erreur: "No AI API key configured"**
- ✅ Ajoute GEMINI_API_KEY ou OPENAI_API_KEY dans le .env

**Erreur: "Invalid response format"**
- L'IA n'a pas retourné du JSON valide
- Essaie avec une autre catégorie ou force le refresh

**Erreur: "Les news ont déjà été récupérées"**
- ✅ C'est normal! Utilise `forceRefresh: true` pour tester

---

## 📚 Prochaines étapes

1. ✅ Ajouter les autres catégories (sport, politique, etc.)
2. ✅ Créer un bouton "Actualiser les news" dans le frontend
3. ✅ Afficher les dates de dernière mise à jour
4. ✅ Ajouter des notifications quand de nouvelles news arrivent
