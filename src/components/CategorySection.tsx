'use client';

import { useState } from 'react';
import type { Category } from '@/lib/types';
import SubforumRow from './SubforumRow';

interface CategorySectionProps {
  category: Category;
}

export default function CategorySection({ category }: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ marginBottom: '12px', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
      {/* Category header - clickable to collapse */}
      <div
        className="category-header"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
            &#9660;
          </span>
          <span>{category.name}</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', fontSize: '11px', fontWeight: '400', opacity: 0.8, textTransform: 'none', letterSpacing: 'normal' }}>
          <span>Threads</span>
          <span>Messages</span>
          <span style={{ minWidth: '140px', textAlign: 'right' }}>Last Post</span>
        </div>
      </div>

      {/* Subforum list */}
      {!collapsed && (
        <div>
          {category.subforums.map((subforum) => (
            <SubforumRow key={subforum.id} subforum={subforum} />
          ))}
          {category.subforums.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'var(--content-bg)' }}>
              No subforums in this category yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
