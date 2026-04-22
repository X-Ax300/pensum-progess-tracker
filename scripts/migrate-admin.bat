@echo off
setlocal enabledelayedexpansion

REM Admin SDK Migration Script - Non-Interactive

cd /d "%~dp0.."

echo.
echo ====================================================================
echo   Migracion con Firebase Admin SDK
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
echo PASO 1: Instalando firebase-admin
echo ====================================================================
echo.
call npm install firebase-admin --save-dev
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] No se pudo instalar firebase-admin
    pause
    exit /b 1
)
echo.

echo ====================================================================
echo PASO 2: Preparando firebase-key.json
echo ====================================================================
echo.
echo Acciones necesarias:
echo   1. Ve a: https://console.firebase.google.com/
echo   2. Selecciona: pensum-progress-tracker
echo   3. Ve a: Project Settings (engrane arriba a la derecha)
echo   4. Pestaña: Service Accounts
echo   5. Click: Generate New Private Key
echo   6. Guarda archivo como: firebase-key.json
echo   7. Mueve el archivo a: %CD%
echo.

if not exist "firebase-key.json" (
    echo [ESPERA] Presiona ENTER cuando hayas guardado firebase-key.json en %CD%
    pause
)

if not exist "firebase-key.json" (
    echo [ERROR] firebase-key.json no encontrado en %CD%
    echo Verifica que el archivo fue movido correctamente
    pause
    exit /b 1
)

echo [OK] firebase-key.json encontrado
echo.

echo ====================================================================
echo PASO 3: Ejecutando migracion
echo ====================================================================
echo.

call node scripts\migrateToNewStructure.js

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
