'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE } from './auth';

export async function signOut() {
  (await cookies()).delete(AUTH_COOKIE);
  redirect('/');
}
