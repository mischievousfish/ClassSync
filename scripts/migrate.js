#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const migrationsDirectory = path.resolve(process.env.MIGRATIONS_DIR || path.join(__dirname, '../migrations'));

async function main() {
  const migrations = fs.readdirSync(migrationsDirectory).filter((file) => /^v\d+\.\d+_.+\.(js|cjs)$/.test(file)).sort();
  const applied = await db.collection('_migrations').get();
  const appliedNames = new Set(applied.docs.map((document) => document.id));
  for (const filename of migrations) {
    if (appliedNames.has(filename)) continue;
    const reference = db.collection('_migration_locks').doc(filename);
    const acquired = await db.runTransaction(async (transaction) => {
      const lock = await transaction.get(reference);
      if (lock.exists && lock.data().status === 'COMPLETED') return false;
      transaction.set(reference, { status: 'RUNNING', startedAt: admin.firestore.FieldValue.serverTimestamp() });
      return true;
    });
    if (!acquired) continue;
    try {
      const migration = require(path.join(migrationsDirectory, filename));
      if (typeof migration.up !== 'function') throw new Error(`${filename} must export up(db)`);
      await migration.up(db);
      await db.collection('_migrations').doc(filename).set({ filename, completedAt: admin.firestore.FieldValue.serverTimestamp() });
      await reference.update({ status: 'COMPLETED', completedAt: admin.firestore.FieldValue.serverTimestamp() });
      console.log(`Applied ${filename}`);
    } catch (error) {
      await reference.update({ status: 'FAILED', error: error.message, failedAt: admin.firestore.FieldValue.serverTimestamp() });
      throw error;
    }
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });