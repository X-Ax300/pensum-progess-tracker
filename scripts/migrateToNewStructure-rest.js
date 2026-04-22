/**
 * Alternative Migration Script - Using Firestore REST API
 * 
 * This version doesn't require firebase-admin SDK installation
 * Run it from Cloud Shell, Node.js environment, or any terminal with curl/fetch
 * 
 * Usage:
 * 1. Set environment variables:
 *    export FIRESTORE_PROJECT_ID="your-project-id"
 *    export FIRESTORE_API_KEY="your-web-api-key"
 * 
 * 2. Run: node scripts/migrateToNewStructure-rest.js
 */

const https = require('https');
const projectId = process.env.FIRESTORE_PROJECT_ID;
const apiKey = process.env.FIRESTORE_API_KEY;

if (!projectId || !apiKey) {
  console.error('❌ Error: FIRESTORE_PROJECT_ID and FIRESTORE_API_KEY environment variables are required');
  console.error('Set them before running:');
  console.error('  export FIRESTORE_PROJECT_ID="your-project-id"');
  console.error('  export FIRESTORE_API_KEY="your-web-api-key"');
  process.exit(1);
}

const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

let stats = {
  subjectsMigrated: 0,
  prerequisitesMigrated: 0,
  errors: [],
};

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}${path}?key=${apiKey}`);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 300) {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          } else {
            resolve(body ? JSON.parse(body) : null);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function migrateData() {
  console.log('🚀 Starting migration using REST API...\n');

  try {
    // Fetch all subjects
    console.log('📖 Reading old subjects...');
    const subjectsResponse = await makeRequest('GET', '/subjects');
    const subjects = subjectsResponse.documents || [];

    if (subjects.length === 0) {
      console.log('⚠️  No subjects found to migrate');
      return;
    }

    // Group by career
    const subjectsByCareer = {};
    subjects.forEach(doc => {
      const career = doc.fields.career?.stringValue || 'Unknown';
      if (!subjectsByCareer[career]) {
        subjectsByCareer[career] = [];
      }
      subjectsByCareer[career].push(doc);
    });

    console.log(`✅ ${subjects.length} subjects found`);
    console.log(`📦 Grouped into ${Object.keys(subjectsByCareer).length} careers\n`);

    // Fetch all prerequisites
    console.log('🔗 Reading old prerequisites...');
    const prereqResponse = await makeRequest('GET', '/prerequisites');
    const prerequisites = prereqResponse.documents || [];

    const prereqsByCareer = {};
    prerequisites.forEach(doc => {
      const career = doc.fields.career?.stringValue || 'Unknown';
      if (!prereqsByCareer[career]) {
        prereqsByCareer[career] = [];
      }
      prereqsByCareer[career].push(doc);
    });

    console.log(`✅ ${prerequisites.length} prerequisites found\n`);

    // Migrate each career
    console.log('🔄 Migrating to new structure...\n');

    for (const [careerName, careerSubjects] of Object.entries(subjectsByCareer)) {
      console.log(`📚 Career: ${careerName}`);

      try {
        // Create pensum document
        const pensumData = {
          fields: {
            careerName: { stringValue: careerName },
            uploadedBy: { stringValue: 'migration-script-rest' },
            uploadedAt: { timestampValue: new Date().toISOString() },
            totalSubjects: { integerValue: careerSubjects.length },
            description: { stringValue: `Pensum de ${careerName} (migrated)` },
            createdAt: { timestampValue: new Date().toISOString() },
          },
        };

        await makeRequest('PATCH', `/pensum/${careerName}`, {
          fields: pensumData.fields,
        });

        console.log(`  ✅ Pensum document created`);

        // Migrate subjects
        for (const subject of careerSubjects) {
          const docId = subject.name.split('/').pop();
          await makeRequest('PATCH', `/pensum/${careerName}/subjects/${docId}`, {
            fields: subject.fields,
          });
          stats.subjectsMigrated++;
        }
        console.log(`  ✅ ${careerSubjects.length} subjects migrated`);

        // Migrate prerequisites
        const careerPrereqs = prereqsByCareer[careerName] || [];
        if (careerPrereqs.length > 0) {
          for (const prereq of careerPrereqs) {
            const docId = prereq.name.split('/').pop();
            await makeRequest('PATCH', `/pensum/${careerName}/prerequisites/${docId}`, {
              fields: prereq.fields,
            });
            stats.prerequisitesMigrated++;
          }
          console.log(`  ✅ ${careerPrereqs.length} prerequisites migrated`);
        }
      } catch (error) {
        const msg = `Error migrating ${careerName}: ${error.message}`;
        console.error(`  ❌ ${msg}`);
        stats.errors.push(msg);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Subjects migrated: ${stats.subjectsMigrated}`);
    console.log(`✅ Prerequisites migrated: ${stats.prerequisitesMigrated}`);
    
    if (stats.errors.length > 0) {
      console.log(`\n❌ Errors: ${stats.errors.length}`);
      stats.errors.forEach(e => console.log(`   - ${e}`));
    } else {
      console.log(`\n✨ Migration completed successfully!`);
    }

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

migrateData();
