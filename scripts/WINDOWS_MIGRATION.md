# 🚀 Migración en Windows - Guía Rápida

## ⭐ Opción 1: Recomendada (Admin SDK)

**Script:** `migrate-admin.bat`  
**Ventajas:** Más rápido, más confiable  
**Requisito:** `firebase-key.json` desde Firebase Console

### Ejecutar:
```powershell
cd "d:\programacion\pensum progess tracker"
scripts\migrate-admin.bat
```

El script te guiará paso a paso.

---

## Opción 2: Alternativa (REST API)

**Script:** `migrate-rest.bat`  
**Ventajas:** No necesita SDK instalado  
**Requisito:** Project ID y API Key

### Ejecutar:
```powershell
cd "d:\programacion\pensum progess tracker"
scripts\migrate-rest.bat
```

Te pedirá que ingreses:
- **Project ID** (de Firebase Console)
- **API Key** (de Google Cloud Console)

---

## 📝 Pasos Detallados

### Paso 1: Abre Terminal/PowerShell

```bash
# Navega al proyecto
cd d:\programacion\pensum progess tracker\scripts
```

### Paso 2: Ejecuta el Script

```bash
migrate-simple.bat
```

### Paso 3: Sigue las Instrucciones en Pantalla

El script te guiará paso a paso.

---

## ✅ Después de la Migración

1. **Actualiza Firestore Rules** (IMPORTANTE)
   - Lee: [UPLOAD_PENSUM_ERROR.md](../UPLOAD_PENSUM_ERROR.md)
   - O: [FIRESTORE_RULES_UPDATE.md](../FIRESTORE_RULES_UPDATE.md)

2. **Recarga el navegador** en la app

3. **Prueba subir un PDF**

---

## 🛠️ Si Tienes Problemas

### Error: "Node.js no encontrado"
- Instala Node.js desde https://nodejs.org/
- Reinicia la terminal después

### Error: "firebase-key.json no encontrado"
- ¿Guardaste el archivo en la **raíz del proyecto**? (no en scripts/)
- ¿El nombre es exacto? `firebase-key.json`

### El script no muestra menú
- Intenta cerrar y reabrir la terminal
- Prueba con PowerShell en lugar de CMD

### Error de permisos
- Asegúrate que estás en el directorio `scripts/`
- Prueba hacer click derecho en PowerShell → "Run as administrator"

---

## 📚 Scripts Disponibles

| Script | Para | Ventaja |
|--------|------|---------|
| `migrate-simple.bat` | Windows | ✅ Más confiable y claro |
| `migrate.bat` | Windows | Legacy (puede tener problemas) |
| `migrate.sh` | macOS/Linux | Version para Unix |

---

## 🚀 Ejecución Rápida

```bash
cd d:\programacion\pensum progess tracker\scripts
migrate-simple.bat
# Y sigue el menú interactivo
```

¿Intentaste ejecutar el script? ¿Qué pasó? 👍
