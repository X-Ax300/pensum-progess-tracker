# 🔒 Error al Subir Pensum: Permisos Insuficientes

## ⚠️ Problema

Cuando intentas subir un pensum (PDF), ves este error:

```
UploadPensum.tsx:236 FirebaseError: Missing or insufficient permissions
```

Esto significa que las **reglas de Firestore no permiten ESCRIBIR** en la colección `pensum/`.

---

## ✅ Solución: Actualizar Reglas con Permisos de Escritura

### Paso 1: Ve a Firebase Console

1. 🔗 https://console.firebase.google.com/
2. Selecciona tu proyecto **pensum-progress-tracker**
3. **Firestore Database** → Pestaña **Rules**

### Paso 2: Actualiza las Reglas

**Reemplaza TODAS las reglas antiguas** con esto:

```firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ✅ Público: Lectura | Autenticado: Crear nuevo pensum
    match /pensum/{careerName} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if false;
      
      match /subjects/{document=**} {
        allow read: if true;
        allow write: if request.auth != null && exists(/databases/$(database)/documents/pensum/$(careerName));
      }
      
      match /prerequisites/{document=**} {
        allow read: if true;
        allow write: if request.auth != null && exists(/databases/$(database)/documents/pensum/$(careerName));
      }
    }
    
    // Legacy
    match /subjects/{document=**} {
      allow read: if true;
    }
    
    match /prerequisites/{document=**} {
      allow read: if true;
    }
    
    // Privado
    match /user_progress/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId || 
                           request.auth.uid == request.resource.data.userId;
    }
    
    match /userProfiles/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId || 
                          request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### Paso 3: Publish

Click en botón **Publish** (esquina superior derecha)

---

## ⏳ Después de Publicar

1. **Espera 5-10 segundos** a que se propaguen las reglas
2. **Recarga el navegador** (Ctrl+R o Cmd+R)
3. Intenta subir el PDF nuevamente

---

## 🔐 Qué Cambiaron Las Reglas

| Antes | Ahora |
|-------|-------|
| ❌ Solo lectura en `pensum/` | ✅ **Escritura** permitida para autenticados |
| ❌ No podías crear pensum | ✅ Puedes crear si estás autenticado |
| ❌ Error de permisos | ✅ Error debe desaparecer |

---

## 📋 Cómo Funcionan las Nuevas Reglas

```
match /pensum/{careerName}
├── allow read: if true                    ✅ Todos leen
├── allow create: if request.auth != null  ✅ Solo autenticados crean (IF NO EXISTE)
├── allow update, delete: if false         ❌ Nadie puede modificar/eliminar
│
├── match /subjects/{document=**}
│   ├── allow read: if true                ✅ Todos leen
│   └── allow write: if request.auth != null AND exists(pensum)  ✅ Solo si existe pensum
│
└── match /prerequisites/{document=**}
    ├── allow read: if true                ✅ Todos leen
    └── allow write: if request.auth != null AND exists(pensum)  ✅ Solo si existe pensum
```

---

## ✅ Checklist

- [ ] Copié las nuevas reglas
- [ ] Pegué en Firebase Console (Rules)
- [ ] Hice click en "Publish"
- [ ] Esperé 5-10 segundos
- [ ] Recargué el navegador
- [ ] Intento subir pensum nuevamente?
- [ ] ✅ ¡Funciona!

Si sigue sin funcionar, verifica:
- ¿Estás autenticado (registrado/logeado)?
- ¿Hiciste click en "Publish"?
- ¿Recargaste la página?

---

## 📚 Archivos Relacionados

- [firestore.rules](../firestore.rules) - Las reglas (copia/pega directo)
- [FIRESTORE_RULES_UPDATE.md](FIRESTORE_RULES_UPDATE.md) - Guía completa
- [FIREBASE_SETUP.md](../FIREBASE_SETUP.md) - Setup inicial
