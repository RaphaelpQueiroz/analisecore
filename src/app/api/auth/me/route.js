import { NextResponse } from 'next/server';
import { adminAuth, adminDb, initError } from '../../../../lib/firebaseAdmin';

export async function GET(request) {
  if (initError) {
    return NextResponse.json({ error: 'Firebase Init Error', details: initError }, { status: 500 });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const docSnap = await adminDb.collection('users').doc(decodedToken.uid).get();
    
    if (docSnap.exists) {
      return NextResponse.json({ userData: docSnap.data() });
    } else {
      return NextResponse.json({ userData: { perfil: 'comum', precisaTrocarSenha: false } });
    }
  } catch (err) {
    console.error('Error fetching /api/auth/me:', err);
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 401 });
  }
}

export async function POST(request) {
  if (initError) {
    return NextResponse.json({ error: 'Firebase Init Error', details: initError }, { status: 500 });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const body = await request.json();
    
    await adminDb.collection('users').doc(decodedToken.uid).set(body, { merge: true });
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating /api/auth/me:', err);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
