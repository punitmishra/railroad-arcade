import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// ============================================
// Admin Authentication & Authorization
// ============================================

// Admin user IDs (can be configured via env)
const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || [];

// Admin emails (can be configured via env)
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

/**
 * Check if a user is an admin by user ID
 */
export async function isAdmin(userId: string): Promise<boolean> {
  // Check if user ID is in admin list
  if (ADMIN_USER_IDS.includes(userId)) {
    return true;
  }

  // Check if user's email is in admin list
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (user?.email && ADMIN_EMAILS.includes(user.email)) {
    return true;
  }

  return false;
}

/**
 * Get the current session and verify admin access
 * Returns the session if admin, null otherwise
 */
export async function getAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const adminAccess = await isAdmin(session.user.id);
  if (!adminAccess) {
    return null;
  }

  return session;
}

/**
 * Verify admin key header (for API key auth)
 * This is an alternative to session-based admin auth
 */
export function verifyAdminKey(request: Request): boolean {
  const adminKey = request.headers.get('x-admin-key');
  return adminKey === process.env.ADMIN_KEY;
}

/**
 * Check admin access via either session or API key
 * Returns user ID if authenticated, null otherwise
 */
export async function checkAdminAccess(request: Request): Promise<string | null> {
  // First try API key auth
  if (verifyAdminKey(request)) {
    return 'admin-key';
  }

  // Fall back to session auth
  const session = await getAdminSession();
  return session?.user?.id || null;
}
