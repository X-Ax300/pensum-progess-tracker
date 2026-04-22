@echo off
setlocal enabledelayedexpansion

REM REST API Migration Script - Non-Interactive

cd /d "%~dp0.."

echo.
echo ====================================================================
echo   Migracion con REST API
echo   Pensum Progress Tracker
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
echo.

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
echo PASO 1: Obtener credenciales
echo ====================================================================
echo.
echo [Instrucciones para Project ID]
echo   1. Ve a: https://console.firebase.google.com/
echo   2. Selecciona: pensum-progress-tracker
echo   3. Project Settings ^(engrane^) 
echo   4. Copia: Project ID
echo.

set /p projectId="[ENTRADA] FIRESTORE_PROJECT_ID: "

if "!projectId!"=="" (
    echo [ERROR] Project ID es requerido
    pause
    exit /b 1
)

echo.
echo [Instrucciones para API Key]
echo   1. Ve a: https://console.cloud.google.com/apis/credentials
echo   2. Click: Create Credentials
echo   3. Elige: API Key
echo   4. Copia la clave generada
echo.

set /p apiKey="[ENTRADA] FIRESTORE_API_KEY: "

if "!apiKey!"=="" (
    echo [ERROR] API Key es requerido
    pause
    exit /b 1
)

echo.
echo ====================================================================
echo PASO 2: Ejecutando migracion
echo ====================================================================
echo.

setlocal
set "FIRESTORE_PROJECT_ID=!projectId!"
set "FIRESTORE_API_KEY=!apiKey!"

call node scripts\migrateToNewStructure-rest.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================================
    echo [EXITO] Migracion completada!
    echo ====================================================================
    echo.
    echo Proximos pasos:
    echo   1. Ve a Firebase Console ^> Firestore ^> Rules
    echo   2. Actualiza las reglas con el contenido de: firestore.rules
    echo   3. Click: Publish
    echo   4. Recarga la aplicacion en el navegador
    echo.
) else (
    echo.
    echo ====================================================================
    echo [ERROR] La migracion fallo
    echo ====================================================================
    echo.
)

pause
exit /b %ERRORLEVEL%
