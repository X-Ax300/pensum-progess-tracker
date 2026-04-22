# 🔧 Guía Completa: Scripts de Migración Disponibles

## 📊 Comparativa de Scripts Windows

| Script | Método | Requisitos | Ventajas | Desventajas |
|--------|--------|-----------|----------|-------------|
| `migrate-admin.bat` | Admin SDK | firebase-key.json | Rápido, confiable, oficial | Requiere descargar JSON |
| `migrate-rest.bat` | REST API | Project ID + API Key | Fácil, sin descargas | Más lento |
| `migrate-simple.bat` | Menú interactivo | Depende de selección | Flexible | Puede tener issues de input |

---

## ✅ RECOMENDADO: `migrate-admin.bat`

### Paso 1: Abre Terminal
```powershell
cd "d:\programacion\pensum progess tracker"
```

### Paso 2: Ejecuta
```batch
scripts\migrate-admin.bat
```

### Paso 3: El script hará:
- ✅ Verificar Node.js v22.12.0
- ✅ Verificar npm v10.9.0
- ✅ Instalar `firebase-admin` con npm
- ✅ Mostrar instrucciones para descarga `firebase-key.json`
- ✅ Pedir que presiones ENTER
- ✅ Ejecutar migración
- ✅ Mostrar confirmación

### 🔑 Obtener firebase-key.json

1. Ve a: https://console.firebase.google.com/
2. Selecciona: **pensum-progress-tracker**
3. Click en engrane (⚙️) → **Project Settings**
4. Pestaña: **Service Accounts**
5. Click: **Generate New Private Key**
6. Se descargará: `pensum-progress-tracker-xxxxx.json`
7. Renómbralo a: `firebase-key.json`
8. Muévelo a: `d:\programacion\pensum progess tracker\`

---

## 🔄 ALTERNATIVA: `migrate-rest.bat`

Si no quieres descargar el JSON, usa REST API:

```batch
scripts\migrate-rest.bat
```

### Credenciales necesarias:

**1. Project ID:**
- Firebase Console → Project Settings → General
- Busca: "Project ID"
- Copia el valor

**2. API Key:**
- Ve a: https://console.cloud.google.com/apis/credentials
- Click: **+ Create Credentials**
- Elige: **API Key**
- Copia la clave generada

El script te pedirá ingresar ambos valores.

---

## 📱 Para macOS/Linux

```bash
bash scripts/migrate.sh
```

El script es interactivo y te guiará.

---

## 🚀 Avanzado: Scripts Node.js Directos

Si quieres control total, ejecuta directamente:

```bash
# Con Admin SDK
node scripts/migrateToNewStructure.js

# Con REST API
node scripts/migrateToNewStructure-rest.js
```

---

## ⚠️ IMPORTANTE: Actualizar Firestore Rules

**Después de que la migración termine:**

1. Ve a: https://console.firebase.google.com/
2. Firestore Database → **Rules**
3. Reemplaza TODO el contenido con el de: `firestore.rules`
4. Click: **Publish**
5. Espera 5-10 segundos

Sin este paso, obtendrás error: "Missing or insufficient permissions"

---

## ✔️ Verificación

Después de todo:

1. Recarga la app: `Ctrl + R`
2. Login con tu cuenta
3. Selecciona una carrera
4. Intenta subir un PDF
5. Debería funcionar sin errores

---

## 🐛 Troubleshooting

**Q: Node.js no se encuentra**  
A: Instala desde https://nodejs.org/ (v16+)

**Q: npm se ve como no encontrado**  
A: Reinicia la terminal después de instalar Node.js

**Q: "firebase-key.json no encontrado"**  
A: Verifica que el archivo está en `d:\programacion\pensum progess tracker\` (raíz del proyecto)

**Q: Permission error después de migración**  
A: Actualiza firestore.rules en Firebase Console e espera a que publique

**Q: Script se cierra sin hacer nada**  
A: Usa `migrate-admin.bat` en lugar de `migrate-simple.bat`
