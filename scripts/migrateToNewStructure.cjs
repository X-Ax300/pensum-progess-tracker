/**
 * Script de migración: Estructura antigua → Nueva estructura por carrera
 * 
 * ANTES:
 *   subjects/ (colección global)
 *   prerequisites/ (colección global)
 * 
 * DESPUÉS:
 *   pensum/{careerName}/subjects/
 *   pensum/{careerName}/prerequisites/
 * 
 * Uso:
 * node scripts/migrateToNewStructure.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '../firebase-key.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (err) {
  console.error('❌ Error loading service account key from firebase-key.json');
  console.error('Please ensure firebase-key.json exists in project root');
  console.error('Download it from: Firebase Console → Project Settings → Service Accounts → Generate new private key');
  process.exit(1);
}

const db = admin.firestore();

let migrationStats = {
  subjectsByCareer: {},
  prerequisitesByCareer: {},
  pensumCreated: 0,
  subjectsMigrated: 0,
  prerequisitesMigrated: 0,
  errors: [],
};

async function migrateData() {
  console.log('🚀 Iniciando migración de datos...\n');

  try {
    // Step 1: Get all subjects from old structure
    console.log('📖 Leyendo materias antiguas...');
    const subjectsSnapshot = await db.collection('subjects').get();
    
    if (subjectsSnapshot.empty) {
      console.log('⚠️  No hay materias antiguas para migrar');
      return;
    }

    const subjectsByCareer = {};
    
    // Group subjects by career
    subjectsSnapshot.forEach(doc => {
      const data = doc.data();
      const career = data.career || 'Unknown';
      
      if (!subjectsByCareer[career]) {
        subjectsByCareer[career] = [];
      }
      
      subjectsByCareer[career].push({
        id: doc.id,
        data: data,
      });
    });

    console.log(`✅ ${subjectsSnapshot.size} materias encontradas`);
    console.log(`📦 Agrupadas en ${Object.keys(subjectsByCareer).length} carreras\n`);

    // Step 2: Get all prerequisites from old structure
    console.log('🔗 Leyendo prerequisitos antiguos...');
    const prerequisitesSnapshot = await db.collection('prerequisites').get();
    
    const prerequisitesByCareer = {};
    
    prerequisitesSnapshot.forEach(doc => {
      const data = doc.data();
      const career = data.career || 'Unknown';
      
      if (!prerequisitesByCareer[career]) {
        prerequisitesByCareer[career] = [];
      }
      
      prerequisitesByCareer[career].push({
        id: doc.id,
        data: data,
      });
    });

    console.log(`✅ ${prerequisitesSnapshot.size} prerequisitos encontrados\n`);

    // Step 3: Migrate data to new structure
    console.log('🔄 Migrando a nueva estructura...\n');

    for (const [careerName, subjects] of Object.entries(subjectsByCareer)) {
      console.log(`\n📚 Carrera: ${careerName}`);
      
      try {
        // Create pensum metadata document
        const pensumRef = db.collection('pensum').doc(careerName);
        const pensumSnapshot = await pensumRef.get();

        if (!pensumSnapshot.exists) {
          await pensumRef.set({
            careerName,
            uploadedBy: 'migration-script',
            uploadedAt: admin.firestore.Timestamp.now(),
            totalSubjects: subjects.length,
            description: `Pensum de ${careerName} (migrado)`,
            createdAt: admin.firestore.Timestamp.now(),
          });
          migrationStats.pensumCreated++;
          console.log(`  ✅ Documento pensum creado`);
        } else {
          console.log(`  ℹ️  Documento pensum ya existe`);
        }

        // Migrate subjects to subcollection
        const subjectsRef = db.collection('pensum').doc(careerName).collection('subjects');
        
        for (const subject of subjects) {
          const subjectData = { ...subject.data };
          // Remove ID if present
          delete subjectData.id;
          
          await subjectsRef.doc(subject.id).set(subjectData, { merge: true });
          migrationStats.subjectsMigrated++;
        }
        console.log(`  ✅ ${subjects.length} materias migradas`);

        // Migrate prerequisites to subcollection
        const careerPrereqs = prerequisitesByCareer[careerName] || [];
        if (careerPrereqs.length > 0) {
          const prereqRef = db.collection('pensum').doc(careerName).collection('prerequisites');
          
          for (const prereq of careerPrereqs) {
            const prereqData = { ...prereq.data };
            delete prereqData.id;
            
            await prereqRef.doc(prereq.id).set(prereqData, { merge: true });
            migrationStats.prerequisitesMigrated++;
          }
          console.log(`  ✅ ${careerPrereqs.length} prerequisitos migrados`);
        } else {
          console.log(`  ℹ️  Sin prerequisitos`);
        }

      } catch (error) {
        const errorMsg = `Error migrando ${careerName}: ${error.message}`;
        console.error(`  ❌ ${errorMsg}`);
        migrationStats.errors.push(errorMsg);
      }
    }

    // Step 4: Display migration summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Documentos pensum creados: ${migrationStats.pensumCreated}`);
    console.log(`✅ Materias migradas: ${migrationStats.subjectsMigrated}`);
    console.log(`✅ Prerequisitos migrados: ${migrationStats.prerequisitesMigrated}`);
    
    if (migrationStats.errors.length > 0) {
      console.log(`\n❌ Errores encontrados: ${migrationStats.errors.length}`);
      migrationStats.errors.forEach(err => console.log(`   - ${err}`));
    } else {
      console.log(`\n✅ ¡Migración completada sin errores!`);
    }

    // Step 5: Optional - Verify migration
    console.log('\n' + '='.repeat(60));
    console.log('🔍 VERIFICANDO DATOS MIGRADOS');
    console.log('='.repeat(60));

    const pensumDocs = await db.collection('pensum').get();
    console.log(`\n📚 Carreras creadas en nueva estructura: ${pensumDocs.size}`);

    for (const pensumDoc of pensumDocs.docs) {
      const subjects = await pensumDoc.ref.collection('subjects').get();
      const prereqs = await pensumDoc.ref.collection('prerequisites').get();
      
      console.log(`  - ${pensumDoc.id}: ${subjects.size} materias, ${prereqs.size} prerequisitos`);
    }

    console.log('\n✨ ¡Migración completada exitosamente!');
    console.log('Nota: Los datos antiguos en "subjects" y "prerequisites" pueden ser eliminados manualmente.');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await admin.app().delete();
  }
}

// Run migration
migrateData().catch(console.error);
