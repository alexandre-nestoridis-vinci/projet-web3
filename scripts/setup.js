#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🚀 NEWS IA - SETUP AUTOMATIQUE MULTI-PLATEFORME\n');

// Fonction pour exécuter des commandes
function runCommand(command, options = {}) {
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd: options.cwd || process.cwd() 
    });
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de: ${command}`);
    return false;
  }
}

// Vérification des prérequis
function checkPrerequisites() {
  console.log('[1/6] 🔍 Vérification des prérequis...');
  
  try {
    const nodeVersion = execSync('node --version', { stdio: 'pipe', encoding: 'utf8' }).trim();
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    
    if (majorVersion < 20) {
      console.error(`❌ Node.js ${majorVersion} détecté - Version trop ancienne`);
      console.error('⚠️ Angular nécessite Node.js 20.19+ ou 22.12+');
      console.error('📥 Téléchargez: https://nodejs.org/');
      process.exit(1);
    }
    
    console.log(`✅ Node.js ${majorVersion} détecté (compatible)`);
  } catch {
    console.error('❌ Node.js manquant - https://nodejs.org');
    console.error('⚠️ Version requise: Node.js 20.19+ ou 22.12+ (pour Angular)');
    process.exit(1);
  }

  // Installation des CLI si manquants
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    console.log('✅ Firebase CLI détecté');
  } catch {
    console.log('📦 Installation Firebase CLI...');
    if (!runCommand('npm install -g firebase-tools')) {
      process.exit(1);
    }
  }

  try {
    execSync('ng version', { stdio: 'pipe' });
    console.log('✅ Angular CLI détecté');
  } catch {
    console.log('📦 Installation Angular CLI...');
    if (!runCommand('npm install -g @angular/cli')) {
      process.exit(1);
    }
  }
}

// Installation des dépendances
function installDependencies() {
  console.log('\n[2/6] 📦 Installation dépendances racine...');
  if (!runCommand('npm install')) {
    process.exit(1);
  }

  console.log('\n[3/6] 🅰️ Installation dépendances frontend...');
  if (!runCommand('npm install', { cwd: 'frontend' })) {
    process.exit(1);
  }

  console.log('\n[4/6] 🔥 Installation dépendances backend...');
  if (!runCommand('npm install', { cwd: 'backend/functions' })) {
    process.exit(1);
  }
}

// Configuration des fichiers
function setupConfiguration() {
  console.log('\n[5/6] ⚙️ Configuration des environnements...');
  
  // Vérifier que les fichiers de config existent
  const configFiles = [
    'frontend/src/environments/environment.ts',
    'frontend/src/environments/environment.prod.ts',
    'backend/firebase.json',
    'frontend/firebase.json'
  ];

  for (const file of configFiles) {
    if (!fs.existsSync(file)) {
      console.error(`❌ Fichier manquant: ${file}`);
      process.exit(1);
    }
  }
  
  console.log('✅ Configuration validée');
}

// Affichage des instructions finales
function showInstructions() {
  console.log('\n[6/6] 🎉 Configuration terminée!');
  console.log('\n========================================');
  console.log('✅ PROJET PRÊT À UTILISER!');
  console.log('========================================\n');
  
  console.log('🎯 COMMANDES DISPONIBLES:\n');
  console.log('  npm run dev           # Frontend + Backend simultanés');
  console.log('  npm run dev:frontend  # Angular seulement');
  console.log('  npm run dev:backend   # Firebase émulateurs seulement');
  console.log('  npm run build         # Build production');
  console.log('  npm run deploy        # Déploiement Firebase\n');
  
  console.log('📱 URLS DE DÉVELOPPEMENT:\n');
  console.log('  Frontend: http://localhost:4200');
  console.log('  Backend:  http://localhost:5001');
  console.log('  Admin UI: http://localhost:4200 (émulateurs)\n');
  
  console.log('🚀 DÉPLOIEMENT AUTOMATIQUE:\n');
  console.log('  git push origin main');
  console.log('  URL: https://news-app-api-vinci.web.app\n');
}

// Exécution principale
async function main() {
  checkPrerequisites();
  installDependencies();
  setupConfiguration();
  showInstructions();
}

main().catch(console.error);