@echo off
setlocal enabledelayedexpansion

REM Simplified Migration Script for Windows
REM Direct migration choice without complex flow control

cd /d "%~dp0.."

echo.
echo ====================================================================
echo   Migracion de Datos - Pensum Progress Tracker
echo ====================================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no encontrado
    echo Descarga desde: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js: 
node --version

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm no encontrado
    pause
    exit /b 1
)

echo [OK] npm:
npm --version
echo.

echo ====================================================================
echo SELECCIONA UN METODO DE MIGRACION:
echo ====================================================================
echo.
echo [1] Firebase Admin SDK (RECOMENDADO)
echo     - Requiere: firebase-key.json
echo.
echo [2] REST API (Sin dependencias)
echo     - Requiere: Project ID y API Key
echo.

set /p opcion="Elige [1] o [2]: "

if "!opcion!"=="1" (
    goto migrateAdmin
) else if "!opcion!"=="2" (
    goto migrateREST
) else (
    echo [ERROR] Opcion invalida. Por favor elige 1 o 2.
    pause
    exit /b 1
)

:migrateAdmin
echo.
echo ====================================================================
echo OPCION 1: Firebase Admin SDK
echo ====================================================================
echo.

echo [PASO 1] Instalando firebase-admin...
echo.
call npm install firebase-admin --save-dev

echo.
echo [PASO 2] Preparando firebase-key.json
echo.
echo Acciones necesarias:
echo   1. Ve a: https://console.firebase.google.com/
echo   2. Selecciona: pensum-progress-tracker
echo   3. Ve a: Project Settings (engrane)
echo   4. Pestaña: Service Accounts
echo   5. Click: Generate New Private Key
echo   6. Guarda como: firebase-key.json (raiz del proyecto)
echo.

if not exist "firebase-key.json" (
    echo [ESPERA] Presiona ENTER cuando hayas guardado firebase-key.json...
    pause
)

if not exist "firebase-key.json" (
    echo [ERROR] firebase-key.json no encontrado en: %CD%
    echo Verifica que el archivo existe y esta en la raiz del proyecto
    pause
    exit /b 1
)

echo [OK] firebase-key.json encontrado
echo.
echo [PASO 3] Ejecutando migracion...
echo.
call node scripts\migrateToNewStructure.js

goto migracionCompleta

:migrateREST
echo.
echo ====================================================================
echo OPCION 2: REST API (Sin dependencias)
echo ====================================================================
echo.

echo [PASO 1] Obtener credenciales
echo.
echo Ve a: https://console.firebase.google.com/
echo Selecciona: pensum-progress-tracker
echo Project Settings ^(engrane^) ^> General ^> Project ID
echo.

set /p projectId="[ENTRADA] FIRESTORE_PROJECT_ID: "

echo.
echo Ve a: https://console.cloud.google.com/apis/credentials
echo Create Credentials ^> API Key
echo.

set /p apiKey="[ENTRADA] FIRESTORE_API_KEY: "

if "!projectId!"=="" (
    echo [ERROR] Project ID vacio
    pause
    exit /b 1
)

if "!apiKey!"=="" (
    echo [ERROR] API Key vacio
    pause
    exit /b 1
)

echo.
echo [PASO 2] Ejecutando migracion...
echo.

setlocal enabledelayedexpansion
set FIRESTORE_PROJECT_ID=!projectId!
set FIRESTORE_API_KEY=!apiKey!

call node scripts\migrateToNewStructure-rest.js

goto migracionCompleta

:migracionCompleta
echo.
echo ====================================================================
echo MIGRACION COMPLETADA
echo ====================================================================
echo.
echo [SIGUIENTE]
echo 1. Actualiza las reglas de Firestore (IMPORTANTE)
echo    Ver: FIRESTORE_RULES_UPDATE.md o UPLOAD_PENSUM_ERROR.md
echo.
echo 2. Recarga el navegador (Ctrl+R)
echo.
echo 3. Intenta subir un pensum (PDF)
echo.

pause
exit /b 0
