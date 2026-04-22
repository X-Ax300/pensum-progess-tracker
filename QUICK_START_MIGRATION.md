# ⚡ Quick Start - Migración

## 🎯 En 3 pasos:

### 1️⃣ Abre Terminal
```powershell
cd "d:\programacion\pensum progess tracker"
```

### 2️⃣ Ejecuta el Script
```batch
scripts\migrate-admin.bat
```

### 3️⃣ Sigue las Instrucciones en Pantalla

---

## 📋 Checklist

- [ ] Node.js v22.12.0 instalado
- [ ] Descargué `firebase-key.json` de Firebase
- [ ] Guardé `firebase-key.json` en la raíz del proyecto
- [ ] Ejecuté `migrate-admin.bat`
- [ ] Migración completó exitosamente
- [ ] Actualicé firestore.rules en Firebase Console
- [ ] Publiqué las reglas
- [ ] Recargué la aplicación en el navegador
- [ ] Probé subir un PDF (funciona sin errores)

---

## 🆘 Si Algo Sale Mal

1. Verifica que Node.js está instalado: `node --version`
2. Verifica que npm está disponible: `npm --version`
3. Lee: `FIRESTORE_RULES_UPDATE.md` si ves error de permisos
4. Lee: `UPLOAD_PENSUM_ERROR.md` si ves error al subir PDF
5. Lee: `MIGRATION.md` para troubleshooting detallado
