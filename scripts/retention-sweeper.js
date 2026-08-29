#!/usr/bin/env node
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

async function deleteOld(collection, field) {
  const snapshot = await db.collection(collection).where(field, '<', cutoff).get();
  for (let offset = 0; offset < snapshot.docs.length; offset += 400) {
    const batch = db.batch();
    snapshot.docs.slice(offset, offset + 400).forEach((document) => batch.delete(document.ref));
    await batch.commit();
  }
  return snapshot.size;
}

async function main() {
  const deletedLogs = await deleteOld('application_logs', 'createdAt');
  const deletedOcrRecords = await deleteOld('ocr_uploads', 'createdAt');
  const bucketName = process.env.GCLOUD_STORAGE_BUCKET;
  let deletedFiles = 0;
  if (bucketName) {
    const [files] = await admin.storage().bucket(bucketName).getFiles({ prefix: 'ocr/' });
    const stale = files.filter((file) => file.metadata.timeCreated && new Date(file.metadata.timeCreated) < cutoff);
    await Promise.all(stale.map((file) => file.delete()));
    deletedFiles = stale.length;
  }
  console.log(JSON.stringify({ cutoff: cutoff.toISOString(), deletedLogs, deletedOcrRecords, deletedFiles }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });