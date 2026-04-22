# 🔒 Actualizar Reglas de Seguridad de Firestore

## ⚠️ Problema

Si ves este error:
```
FirebaseError: Missing or insufficient permissions
```

**Significa que tus reglas de seguridad de Firestore NO permiten acceso a la nueva estructura `pensum/`**

---

## ✅ Solución: Actualizar las Reglas

### Paso 1: Ve a Firebase Console

1. 🔗 https://console.firebase.google.com/
2. Selecciona tu proyecto **pensum-progress-tracker**
3. Ve a **Firestore Database** (panel izquierdo)
4. Click en pestaña **Rules**

---

### Paso 2: Reemplaza las Reglas

**Elimina las reglas antiguas** y copia/pega esto:

```firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ✅ Público: Lectura de estructura pensum
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
    
    // ✅ Público: Lectura de materias (legacy)
    match /subjects/{document=**} {
      allow read: if true;
    }
    
    // ✅ Público: Lectura de prerequisitos (legacy)
    match /prerequisites/{document=**} {
      allow read: if true;
    }
    
    // 🔒 Privado: Solo el progreso del usuario autenticado
    match /user_progress/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId || 
                           request.auth.uid == request.resource.data.userId;
    }
    
    // 🔒 Privado: Perfil del usuario
    match /userProfiles/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId || 
                          request.auth.uid == request.resource.data.userId;
    }
  }
}
```

---

### Paso 3: Publish

Click en botón **Publish** (arriba a la derecha)

---

## 📋 Qué Hacen Estas Reglas

| Regla | Quién | Qué | Por Qué |
|-------|-------|-----|--------|
| `pensum/{careerName}` | Todos | **Lee** todo | Materias son públicas |
| `pensum/{careerName}` | Autenticado | **Crea** nuevo | Solo si no existe |
| `pensum/{careerName}/subjects/` | Autenticado | **Escribe** | Solo si el pensum existe |
| `pensum/{careerName}/prerequisites/` | Autenticado | **Escribe** | Solo si el pensum existe |
| `subjects/{document=**}` | Todos | Lee todo | Legacy - datos antiguos |
| `prerequisites/{document=**}` | Todos | Lee todo | Legacy - datos antiguos |
| `user_progress/{document=**}` | Usuario | Lee/escribe propio | Solo ves tu progreso |
| `userProfiles/{document=**}` | Usuario | Lee/escribe propio | Solo ves tu perfil |

---

## ✅ Después de Actualizar

1. Actualiza la regla en Firebase Console ⬆️
2. **Recarga la app** en tu navegador (Ctrl+R o Cmd+R)
3. El error debe desaparecer! ✨

---

## 🔍 Si Aún No Funciona

### Opción A: Usar Modo Testing (Desarrollo)

⚠️ **Inseguro pero funciona rápido:**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Solo para desarrollo.** Antes de producción, usa las reglas de arriba.

### Opción B: Verificar en Firebase Console

Después de actualizar:
1. Ve a Firestore Database
2. Verifica que exista la colección `pensum/`
3. Verifica que tenga subcollections `subjects/` y `prerequisites/`
4. Si no existen, ejecuta el script de migración primero

---

## 📚 Recursos

- [Firestore Security Rules Docs](https://firebase.google.com/docs/firestore/security/start)
- [Firestore Rules Playground](https://firebase.google.com/docs/rules/simulator)
- Ver archivo: `firestore.rules` (tiene las reglas)

---

## 📝 Checklist

- [ ] Actualicé las reglas en Firebase Console
- [ ] Hice click en "Publish"
- [ ] Recargué el navegador (F5)
- [ ] El error desapareció? ✅
- [ ] Puedo ver materias y carrera? ✅

Si todo está marcado ✅, ¡estás listo!
