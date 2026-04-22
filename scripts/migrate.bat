@echo off
setlocal enabledelayedexpansion
REM Migration Setup Script for Windows
REM Prepares environment for data migration

echo.
echo ====================================================================
echo   Configurar Migracion de Datos - Pensum Progress Tracker
echo ====================================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no se encontro en el sistema.
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detectado
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm no se encontro en el sistema.
    pause
    exit /b 1
)

echo [OK] npm detectado
npm --version
echo.

REM Ask user which migration method to use
echo Opciones de Migracion:
echo   1) Usar Firebase Admin SDK (Recomendado)
echo   2) Usar REST API (Sin dependencias adicionales)
echo.
set /p option="Selecciona opcion (1 o 2): "

setlocal disabledelayedexpansion

if "%option%"=="1" (
    goto setupAdminSDK
) else if "%option%"=="2" (
    goto setupREST
) else (
    echo [ERROR] Opcion invalida.
    pause
    exit /b 1
)

:end
echo.
echo ====================================================================
echo   Configuracion completada!
echo ====================================================================
echo.
pause
exit /b 0

:setupAdminSDK
echo.
echo [1] Instalando firebase-admin...
cd ..
npm install firebase-admin --save-dev
cd scripts

echo.
echo [2] Descargando Firebase Service Account Key:
echo   - Ve a https://console.firebase.google.com/
echo   - Selecciona tu proyecto
echo   - Project Settings (icono de engrane)
echo   - Pestaña "Service Accounts"
echo   - "Generate New Private Key"
echo   - Guarda como firebase-key.json en la raiz del proyecto
echo.
set /p confirm="Una vez guardado firebase-key.json, presiona Enter..."

if not exist "..\firebase-key.json" (
    echo [ERROR] firebase-key.json no encontrado.
    pause
    exit /b 1
)

echo [OK] firebase-key.json encontrado
echo.
echo [3] Ejecutando migracion...
node migrateToNewStructure.js

goto end

:setupREST
echo.
echo [1] Este metodo usa REST API (sin instalaciones adicionales)
echo.
echo [2] Necesitas configurar variables de entorno:
echo   - FIRESTORE_PROJECT_ID: Tu ID de proyecto Firebase
echo   - FIRESTORE_API_KEY: Tu Web API Key
echo.
echo Para obtener estos valores:
echo   - Ve a https://console.firebase.google.com/
echo   - Selecciona tu proyecto
echo   - Project Settings (icono de engrane)
echo   - Pestaña "General"
echo   - Copia "Project ID"
echo.
echo   - Ve a https://console.cloud.google.com/apis/credentials
echo   - Crea una API Key
echo.

set /p projectId="Ingresa FIRESTORE_PROJECT_ID: "
set /p apiKey="Ingresa FIRESTORE_API_KEY: "

set FIRESTORE_PROJECT_ID=%projectId%
set FIRESTORE_API_KEY=%apiKey%

echo.
echo [3] Ejecutando migracion...
node migrateToNewStructure-rest.js

goto end
