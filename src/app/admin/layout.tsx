import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AdminSidebar from './AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Redirect non-authenticated users
  if (!session.isLoggedIn || !session.userId) {
    redirect('/login');
  }

  // Redirect non-admin/non-mod users
  if (session.role !== 'admin' && session.role !== 'moderator') {
    redirect('/');
  }

  return (
    <div className="forum-container" style={{ paddingTop: '12px', paddingBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <AdminSidebar role={session.role} />

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
