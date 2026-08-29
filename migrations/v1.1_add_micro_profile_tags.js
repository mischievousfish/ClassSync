exports.up = async function up(db) {
  const snapshot = await db.collection('studentMicroProfiles').get();
  for (let offset = 0; offset < snapshot.docs.length; offset += 400) {
    const batch = db.batch();
    snapshot.docs.slice(offset, offset + 400).forEach((document) => {
      const data = document.data();
      if (!Array.isArray(data.tags)) batch.update(document.ref, { tags: [] });
    });
    await batch.commit();
  }
};