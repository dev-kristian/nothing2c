import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const options = {
      name: '__session',
      value: '', 
      maxAge: -1, 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax' as const,
    };

    cookieStore.set(options);

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error: unknown) {
    console.error('[API Session Logout] Error clearing session cookie:', error);
    return NextResponse.json({ error: 'Failed to clear session cookie.' }, { status: 500 });
  }
}
