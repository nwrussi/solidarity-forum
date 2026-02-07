'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
  role: string;
}

const allLinks = [
  { href: '/admin', label: 'Dashboard', icon: 'D', roles: ['admin', 'moderator'] },
  { href: '/admin/users', label: 'Users', icon: 'U', roles: ['admin'] },
  { href: '/admin/threads', label: 'Threads', icon: 'T', roles: ['admin', 'moderator'] },
  { href: '/admin/posts', label: 'Posts', icon: 'P', roles: ['admin', 'moderator'] },
  { href: '/admin/categories', label: 'Categories', icon: 'C', roles: ['admin'] },
  { href: '/admin/reports', label: 'Reports', icon: 'R', roles: ['admin', 'moderator'] },
  { href: '/admin/customization', label: 'Customization', icon: 'S', roles: ['admin'] },
];

export default function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname();

  const visibleLinks = allLinks.filter((link) => link.roles.includes(role));

  return (
    <div style={{ width: '200px', flexShrink: 0 }}>
      <div className="sidebar-widget">
        <div className="sidebar-widget-header">
          Admin Panel
        </div>
        <div style={{ padding: '4px 0' }}>
          {visibleLinks.map((link) => {
            const isActive = link.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  color: isActive ? 'var(--accent-teal)' : 'var(--text-secondary)',
                  fontWeight: isActive ? '600' : '400',
                  background: isActive ? 'rgba(74, 155, 155, 0.08)' : 'transparent',
                  textDecoration: 'none',
                  borderLeft: isActive ? '3px solid var(--accent-teal)' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '700',
                  background: isActive ? 'var(--accent-teal)' : 'var(--border-color)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                }}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Back to forum link */}
      <div style={{ padding: '8px 0' }}>
        <Link
          href="/"
          style={{
            display: 'block',
            padding: '8px 12px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
          }}
        >
          &larr; Back to Forum
        </Link>
      </div>
    </div>
  );
}
