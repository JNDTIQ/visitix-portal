import * as admin from 'firebase-admin';

admin.initializeApp();

async function setAdmin(uid: string) {
  await admin.firestore().collection('users').doc(uid).update({ role: 'admin' });
  console.log(`User ${uid} is now an admin.`);
}

// Usage: node setAdminRole.js <UID>
const uid = process.argv[2];
if (!uid) {
  console.error('Usage: node setAdminRole.js <UID>');
  process.exit(1);
}
setAdmin(uid).then(() => process.exit(0));
