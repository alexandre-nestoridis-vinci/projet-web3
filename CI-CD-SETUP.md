# 🔥 Configuration CI/CD Firebase

## 🚀 Activation du déploiement automatique (2 minutes)

### 1. Générer la clé de service Firebase

```bash
# Se connecter à Firebase
firebase login

# Aller dans le projet backend
cd backend

# Générer la clé de service pour GitHub Actions
firebase init hosting:github
```

**Questions à répondre :**
- Repository GitHub : `alexandre-nestoridis-vinci/projet-web3`
- Set up workflow for automatic deployment : `Yes`
- Overwrite existing workflow : `Yes`

### 2. Configuration automatique du secret GitHub

Firebase va automatiquement :
- ✅ Créer le secret `FIREBASE_SERVICE_ACCOUNT_NEWS_APP_API_VINCI` 
- ✅ L'ajouter dans **Settings > Secrets and variables > Actions**
- ✅ Configurer les permissions

### 3. Alternative manuelle (si auto-config échoue)

1. Allez sur https://console.firebase.google.com/project/news-app-api-vinci/settings/serviceaccounts
2. Cliquez **Generate new private key** 
3. Téléchargez le fichier JSON
4. Dans votre repo GitHub : **Settings > Secrets and variables > Actions**
5. Cliquez **New repository secret**
6. Nom : `FIREBASE_SERVICE_ACCOUNT_NEWS_APP_API_VINCI`
7. Valeur : Copiez tout le contenu du fichier JSON

### 4. Test du déploiement

```bash
git add .
git commit -m "🚀 Activation CI/CD"
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