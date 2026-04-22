#!/bin/bash
# Migration Setup Script for Linux/macOS
# Prepares environment for data migration

echo ""
echo "===================================================================="
echo "  Configurar Migracion de Datos - Pensum Progress Tracker"
echo "===================================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js no se encontro en el sistema."
    echo "Por favor instala Node.js desde: https://nodejs.org/"
    exit 1
fi

echo "[OK] Node.js detectado"
node --version
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm no se encontro en el sistema."
    exit 1
fi

echo "[OK] npm detectado"
npm --version
echo ""

# Ask user which migration method to use
echo "Opciones de Migracion:"
echo "  1) Usar Firebase Admin SDK (Recomendado)"
echo "  2) Usar REST API (Sin dependencias adicionales)"
echo ""
read -p "Selecciona opcion (1 o 2): " option

case $option in
    1)
        setup_admin_sdk
        ;;
    2)
        setup_rest
        ;;
    *)
        echo "[ERROR] Opcion invalida."
        exit 1
        ;;
esac

echo ""
echo "===================================================================="
echo "  Configuracion completada!"
echo "===================================================================="
echo ""

setup_admin_sdk() {
    echo ""
    echo "[1] Instalando firebase-admin..."
    npm install firebase-admin --save-dev

    echo ""
    echo "[2] Descargando Firebase Service Account Key:"
    echo "   - Ve a https://console.firebase.google.com/"
    echo "   - Selecciona tu proyecto"
    echo "   - Project Settings (icono de engrane)"
    echo "   - Pestaña \"Service Accounts\""
    echo "   - \"Generate New Private Key\""
    echo "   - Guarda como firebase-key.json en la raiz del proyecto"
    echo ""
    read -p "Una vez guardado firebase-key.json, presiona Enter..."

    if [ ! -f "firebase-key.json" ]; then
        echo "[ERROR] firebase-key.json no encontrado."
        exit 1
    fi

    echo "[OK] firebase-key.json encontrado"
    echo ""
    echo "[3] Ejecutando migracion..."
    node scripts/migrateToNewStructure.js
}

setup_rest() {
    echo ""
    echo "[1] Este metodo usa REST API (sin instalaciones adicionales)"
    echo ""
    echo "[2] Necesitas configurar variables de entorno:"
    echo "   - FIRESTORE_PROJECT_ID: Tu ID de proyecto Firebase"
    echo "   - FIRESTORE_API_KEY: Tu Web API Key"
    echo ""
    echo "Para obtener estos valores:"
    echo "   - Ve a https://console.firebase.google.com/"
    echo "   - Selecciona tu proyecto"
    echo "   - Project Settings (icono de engrane)"
    echo "   - Pestaña \"General\""
    echo "   - Copia \"Project ID\""
    echo ""
    echo "   - Ve a https://console.cloud.google.com/apis/credentials"
    echo "   - Crea una API Key"
    echo ""

    read -p "Ingresa FIRESTORE_PROJECT_ID: " projectId
    read -p "Ingresa FIRESTORE_API_KEY: " apiKey

    export FIRESTORE_PROJECT_ID="$projectId"
    export FIRESTORE_API_KEY="$apiKey"

    echo ""
    echo "[3] Ejecutando migracion..."
    node scripts/migrateToNewStructure-rest.js
}
