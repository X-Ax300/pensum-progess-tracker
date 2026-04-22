@echo on
setlocal enabledelayedexpansion

echo DEBUG: Starting script
echo DEBUG: Current directory: %CD%

cd /d "%~dp0.."

echo DEBUG: Changed to: %CD%

echo.
echo ====================================================================
echo   Migracion de Datos - Pensum Progress Tracker
echo ====================================================================
echo.

echo DEBUG: Checking Node.js
where node >nul 2>nul
echo DEBUG: Node errorlevel: %ERRORLEVEL%

echo [OK] Node.js: 
node --version

echo DEBUG: Checking npm
where npm >nul 2>nul
echo DEBUG: npm errorlevel: %ERRORLEVEL%

echo [OK] npm:
npm --version
echo.

echo DEBUG: About to show menu options
echo ====================================================================
echo SELECCIONA UN METODO DE MIGRACION:
echo ====================================================================
echo.
echo [1] Firebase Admin SDK (RECOMENDADO)
echo [2] REST API (Sin dependencias)
echo.

echo DEBUG: About to prompt for input
set /p opcion="Elige [1] o [2]: "

echo DEBUG: Option entered: !opcion!

if "!opcion!"=="1" (
    echo DEBUG: Going to migrateAdmin
    goto migrateAdmin
) else if "!opcion!"=="2" (
    echo DEBUG: Going to migrateREST
    goto migrateREST
) else (
    echo [ERROR] Opcion invalida: !opcion!
    pause
    exit /b 1
)

:migrateAdmin
echo DEBUG: In migrateAdmin
pause
exit /b 0

:migrateREST
echo DEBUG: In migrateREST
pause
exit /b 0
