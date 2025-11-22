# 🚀 Configuration Gemini - Guide Complet

## ⚠️ Problème Identifié

Ta clé API `AIzaSyCLutK0yZ9GWpYxPNiqP1VN5QvjMzRJ_Tg` retourne **404** parce que:
- ✅ La clé existe
- ✅ La clé est unrestricted
- ❌ **L'API Generative Language N'EST PAS ACTIVÉE sur ton projet Google Cloud**

## ✅ Solution - Activer l'API (5 min)

### Étape 1: Aller à Google Cloud Console
https://console.cloud.google.com/

### Étape 2: Sélectionner le projet correct
En haut à gauche, clique sur le dropdown et sélectionne **"vinci"** (pas web3-vinci)

### Étape 3: Activer l'API
1. Va à **"APIs & Services"** (menu gauche)
2. Clique sur **"Library"**
3. Cherche: **"Generative Language API"**
4. Clique dessus
5. Appuie sur le bouton **"ENABLE"**
6. ⏳ Attends 1-2 minutes que l'API s'active

### Étape 4: Vérifier que c'est activé
- Retour à "APIs & Services" → "Enabled APIs"
- Tu dois voir "Generative Language API" dans la liste

### Étape 5: Tester
```powershell
$key = "AIzaSyCLutK0yZ9GWpYxPNiqP1VN5QvjMzRJ_Tg"
$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$key"
$body = @{contents=@(@{parts=@(@{text="hello"})})} | ConvertTo-Json -Depth 10

$response = Invoke-WebRequest -Uri $url -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
"✅ Gemini fonctionne!"
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 1
```

Si tu vois une réponse JSON (pas 404), c'est bon!

### Étape 6: Relancer l'émulateur
```powershell
cd C:\VINCI\projet-web3
npm run dev:backend
```

### Étape 7: Tester l'endpoint
```powershell
$baseUrl = "http://localhost:5001/news-app-api-vinci/us-central1/api"
$response = Invoke-RestMethod -Uri "$baseUrl/api/fetch-ai-news" -Method POST `
  -Body (@{category="informatique"; forceRefresh=$true}|ConvertTo-Json) `
  -ContentType "application/json"
$response | ConvertTo-Json -Depth 3
```

---

## 🔧 Dépannage

### Erreur 404 persiste après activation?
1. Attends 5 minutes (Google met du temps à propager)
2. Supprime `.env` et recrée-le avec la clé
3. Redémarre complètement l'émulateur

### La clé est toujours pas reconnue?
- Vérifie que tu es sur le BON projet ("vinci", pas "web3-vinci")
- Regénère une nouvelle clé depuis "APIs & Services" → "Credentials"
- Mets à jour `.env` avec la nouvelle clé

---

## 📝 Fichiers concernés

- `.env` - Contient `GEMINI_API_KEY`
- `backend/functions/src/aiNewsService.ts` - Appelle l'API Gemini
- `backend/functions/src/index.ts` - Endpoint `/api/fetch-ai-news`

---

## ✨ Une fois que c'est activé

L'endpoint `/api/fetch-ai-news` va:
1. ✅ Tenter d'utiliser Gemini
2. ✅ Récupérer des vraies news du domaine demandé
3. ✅ Les stocker dans Firestore
4. ✅ Cache 1h pour éviter les appels répétés
5. ✅ Si Gemini échoue → fallback OpenAI → fallback Mock Data

Tout ça automatiquement!
