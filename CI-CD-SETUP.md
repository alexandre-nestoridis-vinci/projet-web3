# 🔥 Configuration CI/CD Firebase

Ce fichier contient les instructions pour configurer le déploiement automatique.

## 🚀 Activation du CI/CD (une seule fois)

### 1. Générer la clé de service Firebase

```bash
# Se connecter à Firebase
firebase login

# Générer la clé de service
firebase projects:list
firebase init hosting:github
```

### 2. Configuration GitHub Secrets

Dans votre repo GitHub, allez dans **Settings > Secrets and variables > Actions** et ajoutez :

- `FIREBASE_SERVICE_ACCOUNT_NEWS_APP_API_VINCI` : La clé générée par Firebase

### 3. Test du déploiement

```bash
git add .
git commit -m "🚀 Configuration CI/CD"
git push origin main
```

## ⚡ Déploiement automatique activé !

- ✅ **Push sur main** = déploiement automatique
- ✅ **Pull Request** = preview automatique  
- ✅ **URL live** : https://news-app-api-vinci.web.app

## 🛠️ Déploiement manuel (si besoin)

```bash
# Frontend seulement
npm run deploy

# Avec functions (nécessite plan Blaze)
cd backend
firebase deploy --only functions
```

## 📊 Monitoring

- **Firebase Console** : https://console.firebase.google.com/project/news-app-api-vinci
- **GitHub Actions** : Onglet Actions de votre repo
- **Quotas gratuits** : Dashboard Firebase > Usage