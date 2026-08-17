import { db } from '@/lib/db';
import { NotificationBell } from '@/components/NotificationBell';

export async function Notifications({ userId }: { userId: string }) {
  const notices = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return <NotificationBell items={notices} />;
}

export function BellSkeleton() {
  return <div className="h-9 w-9 rounded-neo border-2 border-ink/10 bg-white" aria-hidden />;
}
