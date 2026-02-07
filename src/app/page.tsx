import { getCategoriesWithSubforums, getForumStats, getRecentActiveThreads, getNewThreads } from '@/lib/queries';
import CategorySection from '@/components/forum/CategorySection';
import Sidebar from '@/components/sidebar/Sidebar';

// Force dynamic rendering since we read from the database
export const dynamic = 'force-dynamic';

export default function HomePage() {
  const categories = getCategoriesWithSubforums();
  const stats = getForumStats();
  const activeThreads = getRecentActiveThreads(5);
  const newThreads = getNewThreads(5);

  return (
    <div className="forum-container" style={{ paddingTop: '12px', paddingBottom: '24px' }}>
      {/* Announcement banner */}
      <div style={{
        background: '#FEF9E7',
        border: '1px solid #F9E79F',
        borderRadius: '4px',
        padding: '10px 14px',
        marginBottom: '12px',
        fontSize: '13px',
        color: '#7D6608',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ fontWeight: '700' }}>Notice:</span>
        Welcome to Solidarity Forum. This is an anonymous community &mdash; no email or personal information is required to register.
      </div>

      {/* Main content area: categories (left) + sidebar (right) */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Main column */}
        <div style={{ flex: '1', minWidth: 0 }}>
          {categories.map((category) => (
            <CategorySection key={category.id} category={category} />
          ))}
        </div>

        {/* Sidebar */}
        <div style={{ width: '280px', flexShrink: 0 }}>
          <Sidebar stats={stats} activeThreads={activeThreads} newThreads={newThreads} />
        </div>
      </div>
    </div>
  );
}
