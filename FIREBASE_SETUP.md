# Guía de Migración a Firebase

## ✅ Cambios Realizados

### 1. Configuración
- ✅ Agregadas variables de entorno en `.env` para Firebase
- ✅ Creado archivo `src/lib/firebase.ts` con configuración de Firebase
- ✅ Reemplazadas referencias de Supabase por Firebase en todo el código

### 2. Autenticación
- ✅ Actualized `Auth.tsx` para usar Firebase Authentication
- ✅ Soporta registro e inicio de sesión con email/contraseña
- ✅ Mensajes de error traducidos al español

### 3. Base de Datos
- ✅ Actualizado `usePensum.ts` para usar Firestore en lugar de PostgreSQL
- ✅ Implementada carga de datos desde colecciones: `subjects`, `prerequisites`, `user_progress`
- ✅ Implementadas funciones de actualización con `setDoc` y `updateDoc`

### 4. UI
- ✅ Agregado botón de "Cerrar sesión" en el Dashboard
- ✅ Integración completa con Firebase Auth State

### 5. Tipos de Datos
- ✅ Actualizados tipos de TypeScript para usar camelCase (Firebase convention)
- ✅ Cambios: `user_id` → `userId`, `subject_code` → `subjectCode`, etc.

---

## 🚀 Pasos Siguientes

### 1. Configurar Firebase Console

1. Ve a https://console.firebase.google.com
2. Selecciona el proyecto "tracker-progress-class"
3. Habilita **Firebase Authentication**:
   - Ve a Authentication → Sign-in method
   - Activa "Email/Password"
4. Habilita **Cloud Firestore**:
   - Ve a Firestore Database
   - Crea una base de datos (modo "testing" para desarrollo, "production" para producción)

### 2. Crear Colecciones

En Firestore, crea manualmente las siguientes colecciones (o usa el script):

#### a) `subjects`
Agrega documentos con esta estructura:
```json
{
  "code": "FGC-101",
  "name": "Fundamentos de Computación",
  "credits": 3,
  "semester": 1,
  "createdAt": "2026-03-07T10:00:00Z"
}
```

#### b) `prerequisites`
```json
{
  "subjectCode": "FGC-102",
  "prerequisiteCode": "FGC-101",
  "createdAt": "2026-03-07T10:00:00Z"
}
```

#### c) `user_progress`
Se crea automáticamente cuando el usuario actualiza su progreso.

### 3. Configurar Security Rules

En Firestore, ve a **Rules** y reemplaza el contenido con:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ✅ Público: Lectura de estructura pensum (nueva)
    // ✅ Autenticado: Crear nuevos pensum
    match /pensum/{careerName} {
      allow read: if true;
      // Solo crear si no existe y está autenticado
      allow create: if request.auth != null;
      // No permitir actualizar o eliminar
      allow update, delete: if false;
      
      // Permitir escribir en subcollections
      match /subjects/{document=**} {
        allow read: if true;
        allow write: if request.auth != null && exists(/databases/$(database)/documents/pensum/$(careerName));
      }
      
      match /prerequisites/{document=**} {
        allow read: if true;
        allow write: if request.auth != null && exists(/databases/$(database)/documents/pensum/$(careerName));
      }
    }
    
    // ✅ Público: Lectura de materias (legacy - antes de migración)
    match /subjects/{document=**} {
      allow read: if true;
    }
    
    // ✅ Público: Lectura de prerequisitos (legacy - antes de migración)
    match /prerequisites/{document=**} {
      allow read: if true;
    }
    
    // 🔒 Privado: Solo el progreso del usuario autenticado
    match /user_progress/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId || 
                           request.auth.uid == request.resource.data.userId;
    }
    
    // 🔒 Privado: Perfil del usuario - solo el propio usuario
    match /userProfiles/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId || 
                          request.auth.uid == request.resource.data.userId;
    }
  }
}
```

**⚠️ IMPORTANTE:** 
- Actualiza las reglas inmediatamente después de hacer la migración
- Solo usuarios **autenticados** pueden crear pensum
- Los pensum, materias y prerequisitos son **públicos** (lectura)
- El progreso es **privado** (solo tu progreso)

### 4. Ejecutar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## 🔒 Seguridad

### Variables de Entorno
✅ La API KEY está en `.env` (gitignored)
✅ No compartir credenciales de Firebase en repositorios públicos
✅ La configuración es sensible a nivel de proyecto

### Autenticación
✅ Firebase Authentication maneja el hashing seguro de contraseñas
✅ Los tokens se manejan automáticamente
✅ Las sesiones persisten automáticamente

### Firestore
✅ Security Rules protegen los datos del usuario
✅ Solo se puede leer/escribir el progreso propio
✅ Datos públicos (subjects, prerequisites) son legibles por todos

---

## 📊 Diferencias con Supabase

| Característica | Supabase (antes) | Firebase (ahora) |
|---------------|------------------|-----------------|
| Auth | Supabase Auth | Firebase Auth |
| DB | PostgreSQL + Realtime | Firestore |
| Campos | snake_case | camelCase |
| Timestamps | ISO strings | Firestore Timestamp |
| Queries | `.select()` | `getDocs()` / `query()` |
| Actualización | `.update()` | `updateDoc()` |
| Inserción | `.insert()` | `setDoc()` |

---

## 🐛 Troubleshooting

### "Cannot find module 'firebase/app'"
```bash
npm install firebase --legacy-peer-deps
```

### "auth/wrong-password" en consola
Es un error de Firebase Authentication, el usuario/contraseña no coincide

### Firestore devuelve datos vacíos
Verifica que:
1. La colección existe en Firestore
2. Los documentos tienen los campos correctos
3. Las Security Rules permiten lectura

### Usuario no ve su progreso
Verifica que la colección `user_progress` tiene documentos con el `userId` correcto

---

## 📝 Notas

- El script de migraciones SQL de Supabase ya no se usa
- Usa el schema de Firestore del archivo `FIREBASE_SCHEMA.md`
- Para datos de prueba, ver [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)

---

## ✨ Características Incluidas

✅ Autenticación con email/contraseña
✅ Gestión de progreso académico
✅ Convalidación de materias
✅ Estadísticas en tiempo real
✅ Interfaz responsiva
✅ Compatibilidad con TypeScript
✅ Security Rules configuradas
✅ Session persistente
