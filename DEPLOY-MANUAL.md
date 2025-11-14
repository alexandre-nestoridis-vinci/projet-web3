# 🚀 Déploiement Manuel Simple

Si vous voulez déployer **maintenant** sans configurer le CI/CD :

## 📦 Déploiement immédiat (2 commandes)

```bash
# 1. Build du projet
cd frontend
npm run build

# 2. Déploiement Firebase
firebase login
firebase deploy --only hosting
```

**Résultat** : Votre site sera live sur https://news-app-api-vinci.web.app

## 🔄 Pour automatiser plus tard

Suivez le guide `CI-CD-SETUP.md` quand vous voudrez activer le déploiement automatique sur `git push`.

## 🎯 Avantages déploiement manuel

- ✅ **Immédiat** - Pas de configuration complexe
- ✅ **Contrôlé** - Vous décidez quand déployer  
- ✅ **Simple** - 2 commandes seulement
- ✅ **Gratuit** - Firebase Hosting plan Spark

## 📅 Pour votre projet VINCI

**Option recommandée** : 
- Développez en local avec les émulateurs
- Déployez manuellement juste avant le rendu vendredi
- Activez le CI/CD plus tard si besoin

**Commandes de déploiement final** :
```bash
# Build optimisé production
npm run build

# Déploiement live
firebase deploy --only hosting
```