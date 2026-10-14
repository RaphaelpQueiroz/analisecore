import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin';

// Mock verifyAdmin just to reuse the logic here, or just import it if it was exported
import { adminAuth } from '../../../../lib/firebaseAdmin';

async function verifyAdmin(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (decodedToken.email === 'compras4@innovus.com.br') {
      return decodedToken.uid;
    }
  } catch (err) {
    console.error(err);
  }
  return null;
}

export async function GET(request) {
  const adminUid = await verifyAdmin(request);
  if (!adminUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const snapshot = await adminDb.collection('logs').orderBy('timestamp', 'desc').limit(100).get();
    const logs = [];
    snapshot.forEach(doc => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    return NextResponse.json({ logs });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
