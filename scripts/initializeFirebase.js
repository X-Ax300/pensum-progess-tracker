import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;
const API_KEY = process.env.VITE_FIREBASE_API_KEY;

if (!PROJECT_ID || !API_KEY) {
  console.error('❌ Error: Missing VITE_FIREBASE_PROJECT_ID or VITE_FIREBASE_API_KEY in .env file');
  process.exit(1);
}

const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Pensum data
const subjects = [
  { code: 'FGC-101', name: 'ORIENTACIÓN ACADÉMICA INSTITUCIONAL', credits: 2, semester: 1 },
  { code: 'FGC-102', name: 'MÉTODO DEL TRABAJO ACADÉMICO', credits: 2, semester: 1 },
  { code: 'FGC-103', name: 'METODOLOGÍA DE LA INVESTIGACIÓN', credits: 3, semester: 1 },
  { code: 'ADE-101', name: 'ADMINISTRACION I', credits: 3, semester: 1 },
  { code: 'FGC-104', name: 'LENGUA ESPAÑOLA I', credits: 3, semester: 2 },
  { code: 'FGC-105', name: 'MATEMÁTICA BÁSICA I', credits: 3, semester: 2 },
  { code: 'FGC-106', name: 'TECNOLOGÍA DE LA INFORMACIÓN Y COMUNICACIÓN I', credits: 3, semester: 2 },
  { code: 'ING-101', name: 'INTRODUCCIÓN A LA INGENIERÍA', credits: 3, semester: 2 },
  { code: 'FGC-107', name: 'HISTORIA SOCIAL DOMINICANA', credits: 3, semester: 3 },
  { code: 'FGC-108', name: 'INGLÉS I', credits: 3, semester: 3 },
  { code: 'DMF-209', name: 'FISICA I', credits: 4, semester: 3 },
  { code: 'INF-221', name: 'INTRODUCCIÓN A LA PROGRAMACIÓN', credits: 3, semester: 3 },
  { code: 'MTI-200', name: 'MATEMÁTICA II', credits: 4, semester: 3 },
  { code: 'FGC-109', name: 'FILOSOFÍA', credits: 2, semester: 4 },
  { code: 'FGC-110', name: 'DESARROLLO SOSTENIBLE Y GESTIÓN DE RIESGOS', credits: 2, semester: 4 },
  { code: 'MTI-300', name: 'MATEMÁTICA III', credits: 4, semester: 4 },
  { code: 'DMF-210', name: 'FISICA II', credits: 4, semester: 4 },
  { code: 'MAT-241', name: 'ESTADISTICA I', credits: 3, semester: 5 },
  { code: 'QUI-400', name: 'QUÍMICA I', credits: 3, semester: 5 },
  { code: 'INF-215', name: 'INGENIERÍA ECONÓMICA', credits: 3, semester: 5 },
  { code: 'ING-103', name: 'CALCULO INTEGRAL', credits: 4, semester: 5 },
  { code: 'MAT-242', name: 'ESTADISTICA II', credits: 3, semester: 6 },
  { code: 'ING-105', name: 'TALLER DE MECÁNICA DE HARDWARE', credits: 3, semester: 6 },
  { code: 'ING-104', name: 'CÁLCULO VECTORIAL', credits: 4, semester: 6 },
  { code: 'INF-222', name: 'SISTEMA OPERATIVO I', credits: 3, semester: 6 },
  { code: 'ING-102', name: 'CIENCIA E INGENIERÍA DE MATERIALES', credits: 4, semester: 6 },
  { code: 'TIC-408', name: 'SEGURIDAD DE LA INFORMACIÓN', credits: 3, semester: 7 },
  { code: 'ISW-301', name: 'TALLER DE PROGRAMACIÓN I', credits: 5, semester: 7 },
  { code: 'INF-437', name: 'REDES INFORMATICAS', credits: 3, semester: 7 },
  { code: 'ISW-311', name: 'ANÁLISIS Y DISEÑO DE SISTEMAS', credits: 4, semester: 7 },
  { code: 'ISW-221', name: 'ESTRUCTURA DE DATOS', credits: 4, semester: 8 },
  { code: 'TIC-402', name: 'ETICA EN TECNOLOGÍA', credits: 2, semester: 8 },
  { code: 'ISW-404', name: 'ELECTIVA I', credits: 3, semester: 8 },
  { code: 'ISW-321', name: 'TALLER DE BASES DE DATOS I', credits: 4, semester: 8 },
  { code: 'ISW-302', name: 'TALLER DE PROGRAMACIÓN II', credits: 5, semester: 9 },
  { code: 'ISW-312', name: 'INGENIERÍA DE SOFTWARE I', credits: 4, semester: 9 },
  { code: 'ISW-314', name: 'INGENIERÍA DE REQUISITOS Y MODELADO', credits: 4, semester: 9 },
  { code: 'ISW-322', name: 'TALLER DE BASES DE DATOS II', credits: 4, semester: 9 },
  { code: 'ISW-324', name: 'SISTEMAS DE INFORMACIÓN GEOGRÁFICA', credits: 3, semester: 9 },
  { code: 'ISW-313', name: 'INGENIERÍA DE SOFTWARE II', credits: 4, semester: 10 },
  { code: 'ISW-303', name: 'TALLER DE PROGRAMACIÓN III', credits: 5, semester: 10 },
  { code: 'ISW-405', name: 'ELECTIVA II', credits: 3, semester: 10 },
  { code: 'ISW-401', name: 'PROYECTO DE SOFTWARE I', credits: 5, semester: 10 },
  { code: 'ISW-403', name: 'PASANTÍA - PRÁCTICA DE INGENIERÍA DE SOFTWARE', credits: 8, semester: 10 },
  { code: 'ISW-304', name: 'TALLER DE PROGRAMACIÓN IV', credits: 5, semester: 11 },
  { code: 'ISW-305', name: 'DISEÑO Y CONSTRUCCIÓN DE INTERFACES', credits: 4, semester: 11 },
  { code: 'ISW-402', name: 'PROYECTO DE SOFTWARE II', credits: 5, semester: 11 },
  { code: 'FGC-111', name: 'SEMINARIO DE GRADO', credits: 3, semester: 11 },
  { code: 'ISW-323', name: 'TALLER DE BASE DE DATOS III', credits: 4, semester: 12 },
  { code: 'ISW-400', name: 'INTELIGENCIA ARTIFICIAL', credits: 4, semester: 12 },
  { code: 'ISW-600', name: 'PROYECTO INTEGRADOR DE SOFTWARE: TRABAJO DE GRADO', credits: 6, semester: 12 },
];

const prerequisites = [
  { subjectCode: 'FGC-104', prerequisiteCode: 'FGC-102' },
  { subjectCode: 'FGC-105', prerequisiteCode: 'FGC-102' },
  { subjectCode: 'FGC-106', prerequisiteCode: 'FGC-102' },
  { subjectCode: 'FGC-107', prerequisiteCode: 'FGC-102' },
  { subjectCode: 'FGC-108', prerequisiteCode: 'FGC-102' },
  { subjectCode: 'DMF-209', prerequisiteCode: 'FGC-105' },
  { subjectCode: 'INF-221', prerequisiteCode: 'FGC-106' },
  { subjectCode: 'MTI-200', prerequisiteCode: 'FGC-105' },
  { subjectCode: 'FGC-109', prerequisiteCode: 'FGC-102' },
  { subjectCode: 'FGC-110', prerequisiteCode: 'FGC-102' },
  { subjectCode: 'MTI-300', prerequisiteCode: 'MTI-200' },
  { subjectCode: 'DMF-210', prerequisiteCode: 'DMF-209' },
  { subjectCode: 'MAT-241', prerequisiteCode: 'FGC-105' },
  { subjectCode: 'QUI-400', prerequisiteCode: 'FGC-105' },
  { subjectCode: 'INF-215', prerequisiteCode: 'MTI-200' },
  { subjectCode: 'ING-103', prerequisiteCode: 'MTI-300' },
  { subjectCode: 'MAT-242', prerequisiteCode: 'MAT-241' },
  { subjectCode: 'ING-105', prerequisiteCode: 'FGC-106' },
  { subjectCode: 'ING-104', prerequisiteCode: 'ING-103' },
  { subjectCode: 'INF-222', prerequisiteCode: 'FGC-106' },
  { subjectCode: 'ING-102', prerequisiteCode: 'QUI-400' },
  { subjectCode: 'TIC-408', prerequisiteCode: 'FGC-106' },
  { subjectCode: 'ISW-301', prerequisiteCode: 'INF-221' },
  { subjectCode: 'INF-437', prerequisiteCode: 'INF-222' },
  { subjectCode: 'ISW-311', prerequisiteCode: 'INF-221' },
  { subjectCode: 'ISW-221', prerequisiteCode: 'ISW-301' },
  { subjectCode: 'TIC-402', prerequisiteCode: 'FGC-110' },
  { subjectCode: 'ISW-321', prerequisiteCode: 'ISW-311' },
  { subjectCode: 'ISW-302', prerequisiteCode: 'ISW-301' },
  { subjectCode: 'ISW-312', prerequisiteCode: 'ISW-301' },
  { subjectCode: 'ISW-314', prerequisiteCode: 'ISW-311' },
  { subjectCode: 'ISW-322', prerequisiteCode: 'ISW-321' },
  { subjectCode: 'ISW-324', prerequisiteCode: 'ISW-321' },
  { subjectCode: 'ISW-313', prerequisiteCode: 'ISW-312' },
  { subjectCode: 'ISW-303', prerequisiteCode: 'ISW-302' },
  { subjectCode: 'ISW-401', prerequisiteCode: 'ISW-312' },
  { subjectCode: 'ISW-403', prerequisiteCode: 'ISW-302' },
  { subjectCode: 'ISW-304', prerequisiteCode: 'ISW-303' },
  { subjectCode: 'ISW-305', prerequisiteCode: 'ISW-302' },
  { subjectCode: 'ISW-402', prerequisiteCode: 'ISW-401' },
  { subjectCode: 'FGC-111', prerequisiteCode: 'FGC-103' },
  { subjectCode: 'ISW-323', prerequisiteCode: 'ISW-322' },
  { subjectCode: 'ISW-400', prerequisiteCode: 'ISW-303' },
];

async function createDocument(collection, documentId, data) {
  const url = `${FIRESTORE_URL}/${collection}?documentId=${documentId}&key=${API_KEY}`;
  
  const body = {
    fields: Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = getFirestoreValue(value);
      return acc;
    }, {}),
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to create document: ${response.statusText}`);
  }

  return response.json();
}

async function createRandomDocument(collection, data) {
  const url = `${FIRESTORE_URL}/${collection}?key=${API_KEY}`;
  
  const body = {
    fields: Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = getFirestoreValue(value);
      return acc;
    }, {}),
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to create document: ${response.statusText}`);
  }

  return response.json();
}

function getFirestoreValue(value) {
  if (typeof value === 'string') {
    return { stringValue: value };
  } else if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { integerValue: value.toString() };
    } else {
      return { doubleValue: value };
    }
  } else if (typeof value === 'boolean') {
    return { booleanValue: value };
  } else if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  } else if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(getFirestoreValue) } };
  } else if (value !== null && typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.entries(value).reduce((acc, [k, v]) => {
          acc[k] = getFirestoreValue(v);
          return acc;
        }, {}),
      },
    };
  }
  return { nullValue: null };
}

async function initializeFirebase() {
  try {
    console.log('🚀 Starting Firebase initialization...\n');
    console.log(`Project ID: ${PROJECT_ID}\n`);

    // Upload subjects
    console.log('📚 Uploading subjects...');
    let subjectCount = 0;
    for (const subject of subjects) {
      try {
        await createDocument('subjects', subject.code, {
          ...subject,
          createdAt: new Date().toISOString(),
        });
        subjectCount++;
        process.stdout.write(`\r✓ Uploaded ${subjectCount}/${subjects.length} subjects`);
      } catch (error) {
        console.error(`\n❌ Error uploading subject ${subject.code}:`, error.message);
      }
    }
    console.log('\n');

    // Upload prerequisites
    console.log('🔗 Uploading prerequisites...');
    let prereqCount = 0;
    for (const prereq of prerequisites) {
      try {
        await createRandomDocument('prerequisites', {
          ...prereq,
          createdAt: new Date().toISOString(),
        });
        prereqCount++;
        process.stdout.write(`\r✓ Uploaded ${prereqCount}/${prerequisites.length} prerequisites`);
      } catch (error) {
        console.error(`\n❌ Error uploading prerequisite:`, error.message);
      }
    }
    console.log('\n');

    console.log('\n✅ Firebase initialization completed successfully!');
    console.log(`
Summary:
- Subjects uploaded: ${subjectCount}/${subjects.length}
- Prerequisites uploaded: ${prereqCount}/${prerequisites.length}
- Total credits: ${subjects.reduce((sum, s) => sum + s.credits, 0)}
- Semesters: 12
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  }
}

initializeFirebase();
