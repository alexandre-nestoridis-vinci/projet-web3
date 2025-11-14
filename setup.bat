@echo off
REM 🚀 Setup automatique projet News IA - VINCI

echo.
echo ========================================
echo 🚀 NEWS IA - SETUP AUTOMATIQUE
echo ========================================
echo.

REM Vérification Node.js
echo [1/6] 🟢 Vérification Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js manquant - Installez depuis: https://nodejs.org
    echo ⚠️ Version requise: Node.js 20.19+ ou 22.12+ (pour Angular)
    pause
    exit /b 1
)

for /f "tokens=1,2 delims=." %%a in ('node --version') do (
    set "major_version=%%a"
    set "minor_version=%%b"
)
set "major_version=%major_version:v=%"

REM Angular 20+ nécessite Node.js 22.12+ (ou 20.19+ pour Angular 18)
if %major_version% LSS 22 (
    echo ❌ Node.js %major_version%.%minor_version% détecté - Version trop ancienne
    echo ⚠️ Angular 20+ nécessite Node.js 22.12+ minimum
    echo 📥 Téléchargez Node.js 22 LTS: https://nodejs.org/
    pause
    exit /b 1
)
if %major_version% EQU 22 (
    if %minor_version% LSS 12 (
        echo ❌ Node.js %major_version%.%minor_version% détecté - Version trop ancienne  
        echo ⚠️ Angular 20+ nécessite Node.js 22.12+ minimum
        echo 📥 Téléchargez Node.js 22 LTS: https://nodejs.org/
        pause
        exit /b 1
    )
)
echo ✅ Node.js %major_version%.%minor_version% détecté (compatible Angular 20)

REM Installation Firebase CLI si manquant
echo [2/6] 🔥 Vérification Firebase CLI...
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installation Firebase CLI...
    npm install -g firebase-tools
    if %errorlevel% neq 0 (
        echo ❌ Erreur installation Firebase CLI
        pause
        exit /b 1
    )
)
echo ✅ Firebase CLI prêt

REM Installation Angular CLI si manquant
echo [3/6] 🅰️ Vérification Angular CLI...
ng version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installation Angular CLI...
    npm install -g @angular/cli
    if %errorlevel% neq 0 (
        echo ❌ Erreur installation Angular CLI
        pause
        exit /b 1
    )
)
echo ✅ Angular CLI prêt

REM Frontend
echo [4/6] 📦 Installation dépendances frontend...
cd frontend
npm install
if %errorlevel% neq 0 (
    echo ❌ Erreur installation frontend
    pause
    exit /b 1
)
echo ✅ Frontend configuré

REM Backend  
echo [5/6] ⚡ Installation dépendances backend...
cd ..\backend\functions
npm install
if %errorlevel% neq 0 (
    echo ❌ Erreur installation backend
    pause
    exit /b 1
)
cd ..\..

echo [6/6] 🎉 Configuration terminée!
echo.
echo ========================================
echo ✅ PROJET PRÊT À UTILISER!
echo ========================================
echo.
echo 🎯 COMMANDES DE DÉVELOPPEMENT:
echo.
echo Frontend Angular:
echo   cd frontend ^&^& ng serve
echo   URL: http://localhost:4200
echo.
echo Backend Firebase:  
echo   cd backend ^&^& firebase emulators:start
echo   Admin UI: http://localhost:4200 (émulateurs)
echo   API: http://localhost:5001
echo.
echo 🚀 DÉPLOIEMENT AUTOMATIQUE:
echo   git push origin main
echo   URL: https://news-app-api-vinci.web.app
echo.
pause