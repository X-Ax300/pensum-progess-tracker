# 🔄 Script de Migración de Datos

Este script migra los datos de la estructura antigua a la nueva estructura organizada por carrera.

## 📋 Estructura de Migración

### Antes (Antigua)
```
subjects/
  ├── doc1 {code, name, credits, semester, career, ...}
  ├── doc2 {code, name, credits, semester, career, ...}
  └── ...

prerequisites/
  ├── doc1 {subjectCode, prerequisiteCode, career, ...}
  ├── doc2 {subjectCode, prerequisiteCode, career, ...}
  └── ...
```

### Después (Nueva)
```
pensum/
  ├── Ingeniería de Software/
  │   ├── {metadata}
  │   ├── subjects/
  │   │   ├── doc1 {code, name, credits, semester, ...}
  │   │   └── doc2 {code, name, credits, semester, ...}
  │   └── prerequisites/
  │       ├── doc1 {subjectCode, prerequisiteCode, ...}
  │       └── doc2 {subjectCode, prerequisiteCode, ...}
  │
  ├── Ingeniería de Datos/
  │   ├── {metadata}
  │   ├── subjects/
  │   └── prerequisites/
  └── ...
```

## 🚀 Cómo Ejecutar

### Opción 1: Script de Configuración Automática (Recomendado)

**Windows:**
```bash
cd scripts
migrate.bat
```

**macOS/Linux:**
```bash
cd scripts
bash migrate.sh
```

Esto lanzará un asistente interactivo que te guiará por todo el proceso.

### Opción 2: Ejecución Manual

#### 2A. Usando Firebase Admin SDK (Recomendado)

1. **Instalar firebase-admin:**
   ```bash
   npm install firebase-admin --save-dev
   ```

2. **Descargar Firebase Service Account Key:**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Selecciona tu proyecto
   - ⚙️ **Project Settings** → Pestaña **Service Accounts**
   - Click **Generate new private key**
   - Guarda el archivo como `firebase-key.json` **en la raíz del proyecto** (no en scripts/)

3. **Ejecutar migración:**
   ```bash
   node scripts/migrateToNewStructure.js
   ```

#### 2B. Usando REST API (Sin dependencias)

1. **Obtener credenciales:**
   - [Firebase Console](https://console.firebase.google.com/)
   - Project Settings → General
   - Copia el **Project ID**
   - [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Crea una **API Key** (Credentials → Create Credentials → API Key)

2. **Ejecutar con variables de entorno:**
   
   **Windows (PowerShell):**
   ```powershell
   $env:FIRESTORE_PROJECT_ID="tu-project-id"
   $env:FIRESTORE_API_KEY="tu-api-key"
   node scripts/migrateToNewStructure-rest.js
   ```

   **Windows (CMD):**
   ```cmd
   set FIRESTORE_PROJECT_ID=tu-project-id
   set FIRESTORE_API_KEY=tu-api-key
   node scripts/migrateToNewStructure-rest.js
   ```

   **macOS/Linux:**
   ```bash
   export FIRESTORE_PROJECT_ID="tu-project-id"
   export FIRESTORE_API_KEY="tu-api-key"
   node scripts/migrateToNewStructure-rest.js
   ```

## ⚠️ Advertencias

- **Haz backup** de tu base de datos antes de ejecutar
- El script es **idempotente** - puedes ejecutarlo varias veces sin problems
- **No elimina** los datos antiguos automáticamente (son preservados para seguridad)
- Los datos antiguos pueden ser eliminados manualmente después de verificar la migración

## 📊 Qué Hace el Script

1. ✅ Lee todas las materias de `subjects`
2. ✅ Lee todos los prerequisitos de `prerequisites`
3. ✅ Agrupa por carrera
4. ✅ Crea estructura `pensum/{careerName}/subjects`
5. ✅ Crea estructura `pensum/{careerName}/prerequisites`
6. ✅ Crea documento `pensum/{careerName}` con metadata
7. ✅ Verifica la migración y muestra reporte

## 📈 Ejemplo de Salida

```
🚀 Iniciando migración de datos...

📖 Leyendo materias antiguas...
✅ 45 materias encontradas
📦 Agrupadas en 3 carreras

🔗 Leyendo prerequisitos antiguos...
✅ 120 prerequisitos encontrados

🔄 Migrando a nueva estructura...

📚 Carrera: Ingeniería de Software
  ✅ Documento pensum creado
  ✅ 15 materias migradas
  ✅ 40 prerequisitos migrados

📚 Carrera: Ingeniería de Datos
  ✅ Documento pensum creado
  ✅ 15 materias migradas
  ✅ 35 prerequisitos migrados

============================================================
📊 RESUMEN DE MIGRACIÓN
============================================================
✅ Documentos pensum creados: 3
✅ Materias migradas: 45
✅ Prerequisitos migrados: 120

🔍 VERIFICANDO DATOS MIGRADOS
============================================================

📚 Carreras creadas en nueva estructura: 3
  - Ingeniería de Software: 15 materias, 40 prerequisitos
  - Ingeniería de Datos: 15 materias, 35 prerequisitos
  - Ingeniería en Ciberseguridad: 15 materias, 45 prerequisitos

✨ ¡Migración completada exitosamente!
```

## 🛠️ Troubleshooting

### Error: "firebase-key.json not found"
- Descargaste la clave de servicio desde Firebase Console?
- Está guardada en la raíz del proyecto como `firebase-key.json`?

### Error: "Permission denied"
- ¿Tu Firebase tiene datos que migrar?
- ¿La clave de servicio tiene permisos de lectura/escritura en Firestore?

### Algunos datos no migraron
- Revisa la sección "Errores encontrados" en el reporte
- Verifica que todos los documentos antiguos tengan el campo `career`

## ♻️ Limpiar Datos Antiguos (Opcional)

Después de verificar que la migración fue exitosa, puedes eliminar los datos antiguos:

**⚠️ ADVERTENCIA: Esto es irreversible**

```bash
# En Firebase Console:
# 1. Ve a Firestore Database
# 2. Colección "subjects" → Eliminar colección
# 3. Colección "prerequisites" → Eliminar colección
```

O usar script:

```javascript
// scripts/deleteOldCollections.js
const admin = require('firebase-admin');

async function deleteOldCollections() {
  const db = admin.firestore();
  
  // Delete subjects collection
  const subjectsDocs = await db.collection('subjects').get();
  for (const doc of subjectsDocs.docs) {
    await doc.ref.delete();
  }
  
  // Delete prerequisites collection
  const prereqDocs = await db.collection('prerequisites').get();
  for (const doc of prereqDocs.docs) {
    await doc.ref.delete();
  }
  
  console.log('✅ Colecciones antiguas eliminadas');
}
```

## ✅ Verificación Post-Migración

1. Verifica en Firebase Console que exista `pensum/` con subcollections
2. Comprueba que el usuario profile sigue funcionando
3. Prueba cargar un pensum nuevo - debe funcionar con la nueva estructura
4. Verifica que el progreso del usuario se guarda en la carrera correcta
