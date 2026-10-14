import { NextResponse } from 'next/server';
import { adminAuth, adminDb, initError } from '../../../../lib/firebaseAdmin';

// Helper function to verify admin token
async function verifyAdmin(request) {
  if (initError) {
    console.error("Firebase Admin Error: ", initError);
    return { error: initError };
  }
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return { error: 'No token provided' };
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (decodedToken.email === 'compras4@innovus.com.br' || decodedToken.email === 'raphaelpqueiroz@gmail.com') {
      return { uid: decodedToken.uid, email: decodedToken.email };
    }
    
    const docSnap = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (docSnap.exists && docSnap.data().perfil === 'admin') {
      return { uid: decodedToken.uid, email: decodedToken.email };
    }
    return { error: 'Not marked as admin in Firestore' };
  } catch (err) {
    console.error(err);
    return { error: err.message };
  }
}

export async function GET(request) {
  const adminData = await verifyAdmin(request);
  if (adminData.error) return NextResponse.json({ error: 'Unauthorized', details: adminData.error }, { status: 401 });

  try {
    const listUsersResult = await adminAuth.listUsers(1000);
    const usersData = [];
    
    // Buscar perfis em batch
    const snapshot = await adminDb.collection('users').get();
    const profiles = {};
    snapshot.forEach(doc => {
      profiles[doc.id] = doc.data();
    });

    listUsersResult.users.forEach((userRecord) => {
      const profile = profiles[userRecord.uid] || {};
      usersData.push({
        uid: userRecord.uid,
        email: userRecord.email,
        perfil: profile.perfil || 'comum',
        precisaTrocarSenha: profile.precisaTrocarSenha || false,
        inativo: profile.inativo || false,
      });
    });

    return NextResponse.json({ users: usersData });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const adminData = await verifyAdmin(request);
  if (adminData.error) return NextResponse.json({ error: 'Unauthorized', details: adminData.error }, { status: 401 });

  try {
    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }

    const userRecord = await adminAuth.createUser({
      email: email,
      password: '123@mudar',
    });

    await adminDb.collection('users').doc(userRecord.uid).set({
      perfil: role || 'comum',
      precisaTrocarSenha: true,
      inativo: false
    });

    await adminDb.collection('logs').add({
      adminUid: adminData.uid,
      adminEmail: adminData.email,
      targetUid: userRecord.uid,
      targetEmail: email,
      action: 'create_user',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const adminData = await verifyAdmin(request);
  if (!adminData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { uid, action } = body;

    if (!uid || !action) return NextResponse.json({ error: 'UID and action required' }, { status: 400 });
    if (uid === adminData.uid && action === 'toggle_status') return NextResponse.json({ error: 'Cannot disable yourself' }, { status: 400 });

    if (action === 'reset_password') {
      await adminAuth.updateUser(uid, { password: '123@mudar' });
      await adminDb.collection('users').doc(uid).set({ precisaTrocarSenha: true }, { merge: true });
      await adminDb.collection('logs').add({ adminUid: adminData.uid, adminEmail: adminData.email, targetUid: uid, action: 'reset_password', timestamp: new Date().toISOString() });
      return NextResponse.json({ success: true, message: 'Senha resetada para 123@mudar' });
    }

    if (action === 'toggle_status') {
      const doc = await adminDb.collection('users').doc(uid).get();
      const isInactive = doc.data()?.inativo || false;
      await adminDb.collection('users').doc(uid).set({ inativo: !isInactive }, { merge: true });
      await adminDb.collection('logs').add({ adminUid: adminData.uid, adminEmail: adminData.email, targetUid: uid, action: isInactive ? 'activate_user' : 'deactivate_user', timestamp: new Date().toISOString() });
      return NextResponse.json({ success: true, inativo: !isInactive });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const adminData = await verifyAdmin(request);
  if (!adminData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');

  if (!uid) return NextResponse.json({ error: 'UID is required' }, { status: 400 });
  if (uid === adminData.uid) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });

  try {
    await adminAuth.deleteUser(uid);
    await adminDb.collection('users').doc(uid).delete();
    await adminDb.collection('logs').add({ adminUid: adminData.uid, adminEmail: adminData.email, targetUid: uid, action: 'delete_user', timestamp: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
