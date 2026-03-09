# 📊 Archivos de Migración

Este directorio contiene todos los scripts y documentación necesarios para migrar datos de la estructura antigua a la nueva estructura organizada por carrera.

## 📁 Archivos Incluidos

### 🚀 Scripts de Migración

**Para Windows:**

1. **`migrate-admin.bat`** ⭐ **RECOMENDADO**
   - Migración con Firebase Admin SDK
   - Más rápido y confiable
   - Requiere: `firebase-key.json`
   - **Uso:** `migrate-admin.bat`

2. **`migrate-rest.bat`**
   - Migración con REST API
   - Sin dependencias adicionales
   - Requiere: Project ID y API Key
   - **Uso:** `migrate-rest.bat`

3. **`migrate-simple.bat`**
   - Menú interactivo para elegir método
   - **Uso:** `migrate-simple.bat`

4. **`migrate.bat`** - Legacy
   - Versión anterior (puede tener problemas)

**Para macOS/Linux:**

5. **`migrate.sh`**
   - Script interactivo automático
   - **Uso:** `bash migrate.sh`

**Scripts Node.js directos (avanzado):**

6. **`migrateToNewStructure.js`**
   - Usa Firebase Admin SDK
   - **Uso:** `node migrateToNewStructure.js`

7. **`migrateToNewStructure-rest.js`**
   - Usa REST API
   - **Uso:** `node migrateToNewStructure-rest.js`

### 📚 Documentación

- **`WINDOWS_MIGRATION.md`** - Guía para Windows (LEER PRIMERO)
- **`MIGRATION.md`** - Guía completa de migración
- **`README.md`** (este archivo) - Índice de archivos

---

## 🎯 Cómo Empezar

### Opción A: Automático (Recomendado) ⭐

**Windows:**
```bash
migrate.bat
```

**macOS/Linux:**
```bash
bash migrate.sh
```

Esto abrirá un asistente que te guiará por todo el proceso.

---

### Opción B: Manual

Sigue la guía en [MIGRATION.md](MIGRATION.md)

---

## 📊 Comparación de Scripts

| Script | Dependencias | Complejidad | Velocidad | Recomendado |
|--------|-------------|------------|-----------|------------|
| `migrate.bat/sh` | Automático | Muy Fácil | - | ✅ Sí |
| `migrateToNewStructure.js` | Node.js + firebase-admin | Fácil | Rápido | ✅ Sí |
| `migrateToNewStructure-rest.js` | Node.js solamente | Medio | Lento | ✔️ Alternativa |

---

## ✅ Checklist Pre-Migración

Antes de ejecutar cualquier script:

- [ ] Lee el archivo [MIGRATION.md](MIGRATION.md)
- [ ] **Haz backup** de tu base de datos Firestore
- [ ] Tienes credenciales de Firebase listas
- [ ] Node.js v14+ está instalado
- [ ] Tienes acceso a [Firebase Console](https://console.firebase.google.com/)

---

## 🔍 Verificación Post-Migración

Después de ejecutar la migración:

1. ✅ Verifica que `pensum/` colección existe
2. ✅ Verifica subcollections `subjects/` y `prerequisites/`
3. ✅ Comprueba que datos están organizados por carrera
4. ✅ Prueba login y carga de pensum en la app
5. ✅ Verifica que el progreso del usuario se graba correctamente

---

## 🛠️ Troubleshooting

### Problema: "firebase-key.json not found"
**Solución:** Descarga la clave desde Firebase Console → Service Accounts

### Problema: "FIRESTORE_PROJECT_ID not set"
**Solución:** Establece la variable de entorno antes de ejecutar

### Problema: "Permission denied" en REST API
**Solución:** Verifica que tu API Key tiene permisos en Firestore

### Problema: Algunos datos no migraron
**Solución:** Verifica que todos los documentos antiguos tienen el campo `career`

---

## 📋 Documentación Completa

Para una guía detallada con ejemplos y explicaciones, consulta:
👉 [MIGRATION.md](MIGRATION.md)

---

## ⚠️ Importante

- **No elimines** los datos antiguos hasta verificar la migración
- La migración es **idempotente** - puedes ejecutarla varias veces
- **Haz backup** antes de empezar
- Contacta al administrador si tienes problemas

---

**Última actualización:** Marzo 2026
