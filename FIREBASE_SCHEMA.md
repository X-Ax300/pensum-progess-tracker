# Firebase Firestore Schema

## Descripción

Esta es la estructura recomendada para la base de datos de Firebase Firestore. El proyecto utiliza una estructura organizada por institución y carrera con subcollections.

## Estructura General

```
pensum/
  ├── {institution}_{career}/ (Document - metadata del pensum)
  │   ├── subjects/ (Subcollection - materias de la carrera)
  │   └── prerequisites/ (Subcollection - prerequisitos de la carrera)
```

## Colecciones

### 1. **pensum/{institution}_{career}** (Documento por Institución y Carrera)
Documento base que almacena metadata del pensum de cada carrera en cada institución.

**Estructura de documento:**
```json
{
  "careerName": "Ingeniería de Software",
  "institution": "Universidad Nacional",
  "uploadedBy": "user-id-123",
  "uploadedAt": "2026-03-07T...",
  "totalSubjects": 45,
  "description": "Pensum de Ingeniería de Software - Universidad Nacional",
  "createdAt": "2026-03-07T...",
  "id": "{institution}_{career} (ID compuesto)"
}
```

**Campos:**
- `careerName` (string): Nombre de la carrera
- `institution` (string): Nombre de la institución
- `uploadedBy` (string): UID del usuario que subió el PDF
- `uploadedAt` (timestamp): Fecha de upload del PDF
- `totalSubjects` (number): Total de materias en el pensum
- `description` (string, opcional): Descripción del pensum
- `createdAt` (timestamp): Fecha de creación

---

### 2. **pensum/{institution}_{career}/subjects** (Subcollection - Materias por Institución y Carrera)
Almacena todas las materias del pensum de una carrera específica en una institución.

**Estructura de documento:**
```json
{
  "code": "FGC-101",
  "name": "Fundamentos de Computación",
  "credits": 3,
  "semester": 1,
  "isValidated": false,
  "career": "Ingeniería de Software",
  "institution": "Universidad Nacional",
  "createdAt": "2026-03-07T...",
  "id": "doc-id (AUTO)"
}
```

**Campos:**
- `code` (string): Código único de la materia
- `name` (string): Nombre de la materia
- `credits` (number): Créditos académicos
- `semester` (number): Número de semestre (1-12)
- `isValidated` (boolean, opcional): Si la materia puede ser convalidada
- `career` (string): Nombre de la carrera
- `institution` (string): Nombre de la institución
- `createdAt` (timestamp): Fecha de creación

**Índices recomendados:**
- `semester` (Ascending)
- `code` (Ascending)

---

### 3. **pensum/{institution}_{career}/prerequisites** (Subcollection - Prerequisitos por Institución y Carrera)
Define las relaciones de prerequisitos entre materias de una carrera específica en una institución.

**Estructura de documento:**
```json
{
  "subjectCode": "FGC-102",
  "prerequisiteCode": "FGC-101",
  "career": "Ingeniería de Software",
  "institution": "Universidad Nacional",
  "createdAt": "2026-03-07T...",
  "id": "doc-id (AUTO)"
}
```

**Campos:**
- `subjectCode` (string): Código de la materia que tiene prerequisitos
- `prerequisiteCode` (string): Código de la materia prerequisito
- `career` (string): Nombre de la carrera
- `institution` (string): Nombre de la institución
- `createdAt` (timestamp): Fecha de creación

---

### 4. **user_progress** (Colección privada - RLS por userId)
Almacena el progreso académico de cada usuario.

**Estructura de documento:**
```json
{
  "userId": "firebase-uid",
  "subjectCode": "FGC-101",
  "status": "completed",
  "isValidated": false,
  "career": "Ingeniería de Software",
  "createdAt": "2026-03-07T...",
  "updatedAt": "2026-03-07T...",
  "id": "doc-id (AUTO)"
}
```

**Campos:**
- `userId` (string): UID del usuario autenticado en Firebase
- `subjectCode` (string): Código de la materia
- `status` (string): Estado - 'pending', 'in_progress', 'completed'
- `isValidated` (boolean): Si la materia fue convalidada
- `career` (string): Nombre de la carrera
- `createdAt` (timestamp): Fecha de creación del registro
- `updatedAt` (timestamp): Fecha de última actualización

**Índices recomendados:**
- `userId` (Ascending) + `career` (Ascending) - Compuesto
- `userId` (Ascending) + `status` (Ascending) - Compuesto

---

## Reglas de Seguridad (Firestore Security Rules)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura pública de pensum (todos los documentos y subcollections)
    match /pensum/{document=**} {
      allow read: if true;
    }

    // Permitir lectura/escritura solo del progreso propio
    match /user_progress/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId || request.auth.uid == request.resource.data.userId;
    }
  }
}
```

---

## Cambios de Migración

Si migras desde la estructura anterior:

1. **subjects** → **pensum/{careerName}/subjects**
   - Agrupa las materias por carrera usando el campo `career` como documento raíz

2. **prerequisites** → **pensum/{careerName}/prerequisites**
   - Agrupa los prerequisitos por carrera

3. Crear documentos en **pensum/{careerName}** con metadata del upload

---

## Cómo Inicializar los Datos

### Opción 1: Mediante Firebase Console

1. Ve a https://console.firebase.google.com
2. Selecciona tu proyecto "tracker-progress-class"
3. Crea las colecciones:
   - `subjects`
   - `prerequisites`
   - `user_progress`
4. Importa los datos usando la opción "Import Collection"

### Opción 2: Mediante Script (Node.js)

Usa el archivo de migración que se proporciona en `/scripts/initializeFirebase.js`

```bash
npm install -g firebase-tools
firebase login
node scripts/initializeFirebase.js
```

---

## Notas Importantes

1. **Variables de Entorno**: Las credenciales de Firebase están en `.env` con el prefijo `VITE_FIREBASE_`
2. **Autenticación**: Usa Firebase Authentication con Email/Password
3. **Timestamps**: Usa `serverTimestamp()` para fechas automáticas del servidor
4. **UID de Usuario**: El Firebase UID se obtiene de `auth.currentUser.uid`
5. **CamelCase**: Los nombres de campos usan camelCase (no snake_case como en Supabase)

---

## Variables de Entorno Requeridas

```
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-auth-domain
VITE_FIREBASE_PROJECT_ID=tracker-progress-class
VITE_FIREBASE_STORAGE_BUCKET=tracker-progress-class.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
VITE_FIREBASE_APP_ID=tu-app-id
VITE_FIREBASE_MEASUREMENT_ID=tu-measurement-id
```
