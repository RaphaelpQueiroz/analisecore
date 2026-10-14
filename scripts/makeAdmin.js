require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

async function makeAdmin() {
  const email = 'compras4@innovus.com.br';
  const user = await admin.auth().getUserByEmail(email);
  await admin.firestore().collection('users').doc(user.uid).set({ perfil: 'admin' }, { merge: true });
  console.log('Success!');
}
makeAdmin();
