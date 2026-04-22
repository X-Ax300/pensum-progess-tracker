/**
 * Migrate legacy user_progress documents into per-user subcollections.
 *
 * Legacy:
 *   user_progress/{randomId}
 *
 * New:
 *   users/{userId}/progress/{career__subjectCode}
 *
 * Usage:
 *   node scripts/migrateUserProgress.cjs
 *   node scripts/migrateUserProgress.cjs --dry-run
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '../firebase-key.json');
const dryRun = process.argv.includes('--dry-run');

function getProgressDocId(career, subjectCode) {
  return `${encodeURIComponent(career)}__${subjectCode}`;
}

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (err) {
  console.error('Error loading service account key from firebase-key.json');
  console.error('Download it from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

const db = admin.firestore();

const stats = {
  scanned: 0,
  migrated: 0,
  skipped: 0,
  errors: 0,
};

async function flushBatch(batch, pendingWrites) {
  if (pendingWrites === 0 || dryRun) return;
  await batch.commit();
}

async function migrateUserProgress() {
  console.log(dryRun ? 'DRY RUN: user_progress migration' : 'Starting user_progress migration');

  try {
    const snapshot = await db.collection('user_progress').get();

    if (snapshot.empty) {
      console.log('No legacy user_progress documents found');
      return;
    }

    console.log(`Found ${snapshot.size} legacy documents`);

    let batch = db.batch();
    let pendingWrites = 0;

    for (const legacyDoc of snapshot.docs) {
      stats.scanned++;

      const data = legacyDoc.data();
      const userId = data.userId;
      const subjectCode = data.subjectCode;
      const career = data.career || 'Unknown';

      if (!userId || !subjectCode) {
        stats.errors++;
        console.error(`Skipping invalid document ${legacyDoc.id}: missing userId or subjectCode`);
        continue;
      }

      const targetDocId = getProgressDocId(career, subjectCode);
      const targetRef = db.collection('users').doc(userId).collection('progress').doc(targetDocId);
      const targetSnapshot = await targetRef.get();

      const payload = {
        userId,
        subjectCode,
        status: data.status || 'pending',
        isValidated: Boolean(data.isValidated),
        career,
        createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: data.updatedAt || admin.firestore.FieldValue.serverTimestamp(),
      };

      if (targetSnapshot.exists) {
        stats.skipped++;
        console.log(`Skipping existing ${userId}/${targetDocId}`);
        continue;
      }

      if (!dryRun) {
        batch.set(targetRef, payload, { merge: true });
        pendingWrites++;
      }

      stats.migrated++;
      console.log(`Migrated ${legacyDoc.id} -> users/${userId}/progress/${targetDocId}`);

      if (pendingWrites === 400) {
        await flushBatch(batch, pendingWrites);
        batch = db.batch();
        pendingWrites = 0;
      }
    }

    await flushBatch(batch, pendingWrites);

    console.log('\nMigration summary');
    console.log(`Scanned: ${stats.scanned}`);
    console.log(`Migrated: ${stats.migrated}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);

    if (dryRun) {
      console.log('\nDry run only. No documents were written.');
    } else {
      console.log('\nMigration completed. Legacy documents were not deleted.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await admin.app().delete();
  }
}

migrateUserProgress();
