# � Guía Rápida de Migración

Sigue estos pasos para migrar tus datos a la nueva estructura.

---

## ⚠️ IMPORTANTE: Actualizar Reglas de Seguridad

**Después de migrar, DEBES actualizar las reglas de Firestore PARA PERMITIR ESCRITURA:**

👉 Lee: [FIRESTORE_RULES_UPDATE.md](FIRESTORE_RULES_UPDATE.md) (2 minutos)

O ve directo a: [UPLOAD_PENSUM_ERROR.md](UPLOAD_PENSUM_ERROR.md) para paso a paso

Sin esto obtendrás error: `Missing or insufficient permissions` al subir PDF

---

## ⚡ Opción 1: Script Automático (⭐ Recomendado - 5 minutos)

### Windows
```bash
cd scripts
migrate.bat
```

### macOS/Linux
```bash
cd scripts
bash migrate.sh
```

**El script te guiará paso a paso.**

---

## 🔧 Opción 2: Manual (Firebase Admin SDK)

### Paso 1: Descargar credenciales Firebase

1. Ve a 🔗 https://console.firebase.google.com/
2. Selecciona tu proyecto **pensum-progress-tracker**
3. ⚙️ **Project Settings** (engrane en la esquina)
4. Pestaña **Service Accounts**
5. Click **Generate New Private Key**
6. Se descargará un JSON - **guárdalo como `firebase-key.json`** en la raíz del proyecto

### Paso 2: Instalar firebase-admin

```bash
npm install firebase-admin --save-dev
```

### Paso 3: Ejecutar migración

```bash
node scripts/migrateToNewStructure.js
```

**Espera a que termine. Verás un resumen al final.**

---

## 📦 Opción 3: REST API (Sin instalar dependencias)

### Paso 1: Obtener credenciales

**Project ID:**
- 🔗 Firebase Console → Project Settings → General
- Copia el **Project ID**

**API Key:**
- 🔗 https://console.cloud.google.com/apis/credentials
- Credentials → Create Credentials → API Key

### Paso 2: Ejecutar con credenciales

**Windows (PowerShell):**
```powershell
$env:FIRESTORE_PROJECT_ID="tu-project-id-aqui"
$env:FIRESTORE_API_KEY="tu-api-key-aqui"
node scripts/migrateToNewStructure-rest.js
```

**Windows (CMD):**
```cmd
set FIRESTORE_PROJECT_ID=tu-project-id-aqui
set FIRESTORE_API_KEY=tu-api-key-aqui
node scripts/migrateToNewStructure-rest.js
```

**macOS/Linux:**
```bash
export FIRESTORE_PROJECT_ID="tu-project-id-aqui"
export FIRESTORE_API_KEY="tu-api-key-aqui"
node scripts/migrateToNewStructure-rest.js
```

---

## ✅ Después de la Migración

1. Abre **Firebase Console**
2. Ve a **Firestore Database**
3. Busca la colección **pensum** - debe existir
4. Dentro debe haber carpetas con nombres de carreras (ej: "Ingeniería de Software")
5. Cada carrera debe tener `subjects/` y `prerequisites/` adentro

**¡Si ves esto, la migración fue exitosa! 🎉**

---

## ⚠️ Antes de Empezar

- ✅ Tienes acceso a Firebase Console
- ✅ Node.js está instalado (`node --version`)
- ✅ Hiciste backup de tu base de datos
- ✅ El proyecto tiene datos en `subjects/` y `prerequisites/`

---

## 🆘 Si Algo Sale Mal

### Error: "firebase-key.json not found"
→ Descargaste el archivo desde Service Accounts? Está en la raíz del proyecto?

### Error: "FIRESTORE_PROJECT_ID not set"
→ Estableciste correctamente la variable de entorno?

### Algunos datos no migraron
→ ¿Todos los documentos antiguos tienen el campo `career`?

**💬 Más ayuda:** Lee [MIGRATION.md](scripts/MIGRATION.md)

---

## 📚 Documentación Completa

- 📖 Guía detallada: [scripts/MIGRATION.md](scripts/MIGRATION.md)
- 📋 Índice de archivos: [scripts/README.md](scripts/README.md)

---

**¡Comenzar migración ahora! 🚀**
