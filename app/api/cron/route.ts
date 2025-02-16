import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  // Check for authorization
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessionsRef = collection(db, 'sessions');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const q = query(
      sessionsRef,
      where('status', '==', 'active'),
      where('createdAt', '<', Timestamp.fromDate(twentyFourHoursAgo))
    );

    const querySnapshot = await getDocs(q);

    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { status: 'inactive' })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ message: `Updated ${updatePromises.length} sessions to inactive` }, { status: 200 });
  } catch (error) {
    console.error('Error updating session status:', error);
    return NextResponse.json({ error: 'Failed to update session status' }, { status: 500 });
  }
}