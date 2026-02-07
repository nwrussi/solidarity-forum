'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AdminCategory {
  id: number;
  name: string;
  description: string;
  sort_order: number;
}

interface AdminSubforum {
  id: number;
  category_id: number;
  name: string;
  description: string;
  sort_order: number;
  icon_color: string;
  icon_label: string;
  thread_count: number;
  post_count: number;
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [subforums, setSubforums] = useState<AdminSubforum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Category form
  const [catModal, setCatModal] = useState<{ mode: 'create' | 'edit'; id?: number; name: string; description: string } | null>(null);

  // Subforum form
  const [sfModal, setSfModal] = useState<{
    mode: 'create' | 'edit';
    id?: number;
    category_id: number;
    name: string;
    description: string;
    icon_color: string;
    icon_label: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (res.status === 403) { router.push('/'); return; }
      const data = await res.json();
      setCategories(data.categories || []);
      setSubforums(data.subforums || []);
    } catch {
      setError('Failed to load categories.');
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearMessages = () => { setError(''); setSuccess(''); };

  // Category actions
  const handleSaveCategory = async () => {
    if (!catModal) return;
    clearMessages();

    const url = catModal.mode === 'create' ? '/api/admin/categories' : `/api/admin/categories/${catModal.id}`;
    const method = catModal.mode === 'create' ? 'POST' : 'PATCH';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catModal.name, description: catModal.description }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save category.');
      } else {
        setCatModal(null);
        setSuccess(catModal.mode === 'create' ? 'Category created.' : 'Category updated.');
        await fetchData();
      }
    } catch {
      setError('Connection error.');
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`Delete category "${name}"? It must not contain any subforums.`)) return;
    clearMessages();
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to delete category.');
      } else {
        setSuccess('Category deleted.');
        await fetchData();
      }
    } catch {
      setError('Connection error.');
    }
  };

  const handleMoveCategory = async (id: number, direction: 'up' | 'down') => {
    clearMessages();
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const index = sorted.findIndex((c) => c.id === id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    try {
      await Promise.all([
        fetch(`/api/admin/categories/${sorted[index].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: sorted[swapIndex].sort_order }),
        }),
        fetch(`/api/admin/categories/${sorted[swapIndex].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: sorted[index].sort_order }),
        }),
      ]);
      await fetchData();
    } catch {
      setError('Failed to reorder.');
    }
  };

  // Subforum actions
  const handleSaveSubforum = async () => {
    if (!sfModal) return;
    clearMessages();

    const url = sfModal.mode === 'create' ? '/api/admin/subforums' : `/api/admin/subforums/${sfModal.id}`;
    const method = sfModal.mode === 'create' ? 'POST' : 'PATCH';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: sfModal.category_id,
          name: sfModal.name,
          description: sfModal.description,
          icon_color: sfModal.icon_color,
          icon_label: sfModal.icon_label,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save subforum.');
      } else {
        setSfModal(null);
        setSuccess(sfModal.mode === 'create' ? 'Subforum created.' : 'Subforum updated.');
        await fetchData();
      }
    } catch {
      setError('Connection error.');
    }
  };

  const handleDeleteSubforum = async (id: number, name: string) => {
    if (!confirm(`Delete subforum "${name}"? It must not contain any threads.`)) return;
    clearMessages();
    try {
      const res = await fetch(`/api/admin/subforums/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to delete subforum.');
      } else {
        setSuccess('Subforum deleted.');
        await fetchData();
      }
    } catch {
      setError('Connection error.');
    }
  };

  const handleMoveSubforum = async (sf: AdminSubforum, direction: 'up' | 'down') => {
    clearMessages();
    const siblings = subforums
      .filter((s) => s.category_id === sf.category_id)
      .sort((a, b) => a.sort_order - b.sort_order);
    const index = siblings.findIndex((s) => s.id === sf.id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= siblings.length) return;

    try {
      await Promise.all([
        fetch(`/api/admin/subforums/${siblings[index].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: siblings[swapIndex].sort_order }),
        }),
        fetch(`/api/admin/subforums/${siblings[swapIndex].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: siblings[index].sort_order }),
        }),
      ]);
      await fetchData();
    } catch {
      setError('Failed to reorder.');
    }
  };

  const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            Category & Subforum Management
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {categories.length} categories, {subforums.length} subforums
          </p>
        </div>
        <button
          className="forum-btn"
          onClick={() => setCatModal({ mode: 'create', name: '', description: '' })}
        >
          + New Category
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '12px', padding: '8px', background: '#FEE2E2', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ color: 'var(--accent-green)', fontSize: '13px', marginBottom: '12px', padding: '8px', background: '#D1FAE5', borderRadius: '4px' }}>
          {success}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        sortedCategories.map((cat) => {
          const catSubforums = subforums
            .filter((sf) => sf.category_id === cat.id)
            .sort((a, b) => a.sort_order - b.sort_order);

          return (
            <div key={cat.id} style={{ marginBottom: '16px', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
              {/* Category header */}
              <div className="category-header" style={{ cursor: 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span>{cat.name}</span>
                  {cat.description && (
                    <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: '8px', fontWeight: '400', textTransform: 'none' }}>
                      {cat.description}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handleMoveCategory(cat.id, 'up')}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '2px 6px', borderRadius: '2px', cursor: 'pointer', fontSize: '12px' }}
                    title="Move up"
                  >
                    &uarr;
                  </button>
                  <button
                    onClick={() => handleMoveCategory(cat.id, 'down')}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '2px 6px', borderRadius: '2px', cursor: 'pointer', fontSize: '12px' }}
                    title="Move down"
                  >
                    &darr;
                  </button>
                  <button
                    onClick={() => setCatModal({ mode: 'edit', id: cat.id, name: cat.name, description: cat.description })}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '2px 6px', borderRadius: '2px', cursor: 'pointer', fontSize: '11px' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    style={{ background: 'rgba(231,76,60,0.6)', border: 'none', color: '#fff', padding: '2px 6px', borderRadius: '2px', cursor: 'pointer', fontSize: '11px' }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Subforums */}
              {catSubforums.length === 0 ? (
                <div style={{ padding: '12px', background: 'var(--content-bg)', fontSize: '13px', color: 'var(--text-muted)' }}>
                  No subforums in this category.
                </div>
              ) : (
                catSubforums.map((sf) => (
                  <div
                    key={sf.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px',
                      background: 'var(--content-bg)', borderBottom: '1px solid var(--border-light)', gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '4px', background: sf.icon_color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '11px', fontWeight: '700', flexShrink: 0,
                      }}>
                        {sf.icon_label}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>{sf.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {sf.description} -- {sf.thread_count} threads, {sf.post_count} posts
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleMoveSubforum(sf, 'up')}
                        style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '3px', padding: '2px 6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)' }}
                      >
                        &uarr;
                      </button>
                      <button
                        onClick={() => handleMoveSubforum(sf, 'down')}
                        style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '3px', padding: '2px 6px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)' }}
                      >
                        &darr;
                      </button>
                      <button
                        onClick={() => setSfModal({
                          mode: 'edit', id: sf.id, category_id: sf.category_id,
                          name: sf.name, description: sf.description,
                          icon_color: sf.icon_color, icon_label: sf.icon_label,
                        })}
                        style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '3px', padding: '2px 8px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSubforum(sf.id, sf.name)}
                        style={{ background: 'none', border: '1px solid var(--accent-red)', borderRadius: '3px', padding: '2px 8px', cursor: 'pointer', fontSize: '11px', color: 'var(--accent-red)', fontWeight: '600' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Add subforum button */}
              <div style={{ padding: '8px 12px', background: 'var(--content-bg)', borderTop: '1px solid var(--border-light)' }}>
                <button
                  onClick={() => setSfModal({
                    mode: 'create', category_id: cat.id,
                    name: '', description: '', icon_color: '#4A9B9B', icon_label: '',
                  })}
                  style={{
                    background: 'none', border: '1px dashed var(--border-color)', borderRadius: '3px',
                    padding: '4px 12px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)',
                    width: '100%',
                  }}
                >
                  + Add Subforum
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Category Modal */}
      {catModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--content-bg)', borderRadius: '6px', padding: '20px', width: '400px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>
              {catModal.mode === 'create' ? 'New Category' : 'Edit Category'}
            </h3>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Name</label>
              <input
                className="forum-input"
                value={catModal.name}
                onChange={(e) => setCatModal({ ...catModal, name: e.target.value })}
                placeholder="Category name"
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Description</label>
              <input
                className="forum-input"
                value={catModal.description}
                onChange={(e) => setCatModal({ ...catModal, description: e.target.value })}
                placeholder="Category description"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button className="forum-btn forum-btn-secondary" onClick={() => setCatModal(null)}>Cancel</button>
              <button className="forum-btn" onClick={handleSaveCategory} disabled={!catModal.name.trim()}>
                {catModal.mode === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subforum Modal */}
      {sfModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--content-bg)', borderRadius: '6px', padding: '20px', width: '450px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>
              {sfModal.mode === 'create' ? 'New Subforum' : 'Edit Subforum'}
            </h3>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Name</label>
              <input
                className="forum-input"
                value={sfModal.name}
                onChange={(e) => setSfModal({ ...sfModal, name: e.target.value })}
                placeholder="Subforum name"
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Description</label>
              <input
                className="forum-input"
                value={sfModal.description}
                onChange={(e) => setSfModal({ ...sfModal, description: e.target.value })}
                placeholder="Subforum description"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Icon Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={sfModal.icon_color}
                    onChange={(e) => setSfModal({ ...sfModal, icon_color: e.target.value })}
                    style={{ width: '36px', height: '36px', padding: '0', border: '1px solid var(--border-color)', borderRadius: '3px', cursor: 'pointer' }}
                  />
                  <input
                    className="forum-input"
                    value={sfModal.icon_color}
                    onChange={(e) => setSfModal({ ...sfModal, icon_color: e.target.value })}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <div style={{ width: '120px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Icon Label</label>
                <input
                  className="forum-input"
                  value={sfModal.icon_label}
                  onChange={(e) => setSfModal({ ...sfModal, icon_label: e.target.value.substring(0, 3).toUpperCase() })}
                  placeholder="AB"
                  maxLength={3}
                />
              </div>
            </div>
            {sfModal.mode === 'edit' && (
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Category</label>
                <select
                  className="forum-input"
                  value={sfModal.category_id}
                  onChange={(e) => setSfModal({ ...sfModal, category_id: parseInt(e.target.value, 10) })}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}
            {/* Preview */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Preview</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '4px', background: sfModal.icon_color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '11px', fontWeight: '700',
                }}>
                  {sfModal.icon_label || sfModal.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{sfModal.name || 'Subforum Name'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sfModal.description || 'Description'}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button className="forum-btn forum-btn-secondary" onClick={() => setSfModal(null)}>Cancel</button>
              <button className="forum-btn" onClick={handleSaveSubforum} disabled={!sfModal.name.trim()}>
                {sfModal.mode === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
