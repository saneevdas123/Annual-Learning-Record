import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';
import { SESSION_COOKIE, verifySessionToken } from './auth';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  registrationNumber: string | null;
  avatarColor: string;
  campusId: string | null;
  departmentId: string | null;
  programId: string | null;
  mentorId: string | null;
  eDeclarationAt: Date | null;
}

// Reads the session cookie, verifies the JWT, and loads the user.
// Returns null if not authenticated. Cached per-request by React.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload?.sub) return null;

  const user = await db.user.findUnique({
    where: { id: payload.sub as string },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      registrationNumber: true,
      avatarColor: true,
      campusId: true,
      departmentId: true,
      programId: true,
      mentorId: true,
      isActive: true,
      eDeclarationAt: true,
    },
  });
  if (!user || !user.isActive) return null;
  const { isActive, ...rest } = user;
  return rest as CurrentUser;
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(...roles: string[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect('/dashboard');
  return user;
}
