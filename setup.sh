#!/bin/bash
# 🚀 Setup automatique projet News IA - VINCI

echo ""
echo "========================================"
echo "🚀 NEWS IA - SETUP AUTOMATIQUE"
echo "========================================"
echo ""

# Vérification Node.js
echo "[1/6] 🟢 Vérification Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js manquant - Installez depuis: https://nodejs.org"
    echo "⚠️ Version requise: Node.js 20.19+ ou 22.12+ (pour Angular)"
    exit 1
fi

NODE_FULL_VERSION=$(node --version | sed 's/v//')
NODE_MAJOR=$(echo $NODE_FULL_VERSION | cut -d. -f1)
NODE_MINOR=$(echo $NODE_FULL_VERSION | cut -d. -f2)

# Angular 20+ nécessite Node.js 22.12+ minimum
if [ "$NODE_MAJOR" -lt 22 ]; then
    echo "❌ Node.js $NODE_FULL_VERSION détecté - Version trop ancienne"
    echo "⚠️ Angular 20+ nécessite Node.js 22.12+ minimum"
    echo "📥 Téléchargez Node.js 22 LTS: https://nodejs.org/"
    exit 1
elif [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -lt 12 ]; then
    echo "❌ Node.js $NODE_FULL_VERSION détecté - Version trop ancienne"
    echo "⚠️ Angular 20+ nécessite Node.js 22.12+ minimum"
    echo "📥 Téléchargez Node.js 22 LTS: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js $NODE_FULL_VERSION détecté (compatible Angular 20)"

# Installation Firebase CLI si manquant
echo "[2/6] 🔥 Vérification Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    echo "📦 Installation Firebase CLI..."
    npm install -g firebase-tools
    if [ $? -ne 0 ]; then
        echo "❌ Erreur installation Firebase CLI"
        exit 1
    fi
fi
echo "✅ Firebase CLI prêt"

# Installation Angular CLI si manquant
echo "[3/6] 🅰️ Vérification Angular CLI..."
if ! command -v ng &> /dev/null; then
    echo "📦 Installation Angular CLI..."
    npm install -g @angular/cli
    if [ $? -ne 0 ]; then
        echo "❌ Erreur installation Angular CLI"
        exit 1
    fi
fi
echo "✅ Angular CLI prêt"

# Frontend
echo "[4/6] 📦 Installation dépendances frontend..."
cd frontend && npm install
if [ $? -ne 0 ]; then
    echo "❌ Erreur installation frontend"
    exit 1
fi
echo "✅ Frontend configuré"

# Backend  
echo "[5/6] ⚡ Installation dépendances backend..."
cd ../backend/functions && npm install
if [ $? -ne 0 ]; then
    echo "❌ Erreur installation backend"
    exit 1
fi
cd ../..

echo "[6/6] 🎉 Configuration terminée!"
echo ""
echo "========================================"
echo "✅ PROJET PRÊT À UTILISER!"
echo "========================================"
echo ""
echo "🎯 COMMANDES DE DÉVELOPPEMENT:"
echo ""
echo "Frontend Angular:"
echo "  cd frontend && ng serve"
echo "  URL: http://localhost:4200"
echo ""
echo "Backend Firebase:"
echo "  cd backend && firebase emulators:start"
echo "  Admin UI: http://localhost:4200 (émulateurs)"
echo "  API: http://localhost:5001"
echo ""
echo "🚀 DÉPLOIEMENT AUTOMATIQUE:"
echo "  git push origin main"
echo "  URL: https://news-app-api-vinci.web.app"
echo ""