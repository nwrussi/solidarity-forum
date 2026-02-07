'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

/**
 * Default settings -- used for reset functionality and initial state.
 */
const DEFAULT_SETTINGS: Record<string, string> = {
  forum_name: 'Solidarity Forum',
  forum_description: 'A community forum',
  primary_color: '#2B4A4D',
  secondary_color: '#4A9B9B',
  accent_color: '#D4A843',
  background_color: '#E8ECEF',
  content_bg_color: '#FFFFFF',
  text_color: '#333333',
  link_color: '#1A6B8A',
  header_bg_color: '#2B4A4D',
  header_text_color: '#FFFFFF',
  category_header_color: '#3A6367',
  font_family: 'system-ui, -apple-system, sans-serif',
  font_size_base: '14px',
  border_radius: '4px',
  content_width: '1200px',
  logo_text: 'SOLIDARITY FORUM',
  custom_css: '',
  dark_mode_enabled: 'false',
  dark_bg_color: '#1a1a2e',
  dark_content_bg: '#16213e',
  dark_text_color: '#e0e0e0',
  dark_header_bg: '#0f3460',
};

/**
 * Preset themes for quick selection.
 */
const PRESET_THEMES: Record<string, Record<string, string>> = {
  'Default Teal': {
    primary_color: '#2B4A4D',
    secondary_color: '#4A9B9B',
    accent_color: '#D4A843',
    background_color: '#E8ECEF',
    content_bg_color: '#FFFFFF',
    text_color: '#333333',
    link_color: '#1A6B8A',
    header_bg_color: '#2B4A4D',
    header_text_color: '#FFFFFF',
    category_header_color: '#3A6367',
  },
  'Dark Mode': {
    primary_color: '#0f3460',
    secondary_color: '#533483',
    accent_color: '#e94560',
    background_color: '#1a1a2e',
    content_bg_color: '#16213e',
    text_color: '#e0e0e0',
    link_color: '#5dade2',
    header_bg_color: '#0f3460',
    header_text_color: '#e0e0e0',
    category_header_color: '#1a3a5c',
  },
  'Blue Ocean': {
    primary_color: '#1a365d',
    secondary_color: '#2b6cb0',
    accent_color: '#ed8936',
    background_color: '#ebf4ff',
    content_bg_color: '#FFFFFF',
    text_color: '#2d3748',
    link_color: '#2b6cb0',
    header_bg_color: '#1a365d',
    header_text_color: '#FFFFFF',
    category_header_color: '#2c5282',
  },
  'Forest Green': {
    primary_color: '#1a3c2a',
    secondary_color: '#38a169',
    accent_color: '#d69e2e',
    background_color: '#f0fff4',
    content_bg_color: '#FFFFFF',
    text_color: '#2d3748',
    link_color: '#276749',
    header_bg_color: '#1a3c2a',
    header_text_color: '#FFFFFF',
    category_header_color: '#2f6b4a',
  },
  'Crimson': {
    primary_color: '#5c1a1a',
    secondary_color: '#c53030',
    accent_color: '#ed8936',
    background_color: '#fff5f5',
    content_bg_color: '#FFFFFF',
    text_color: '#2d3748',
    link_color: '#c53030',
    header_bg_color: '#5c1a1a',
    header_text_color: '#FFFFFF',
    category_header_color: '#822727',
  },
  'Purple Haze': {
    primary_color: '#322659',
    secondary_color: '#805ad5',
    accent_color: '#ed64a6',
    background_color: '#faf5ff',
    content_bg_color: '#FFFFFF',
    text_color: '#2d3748',
    link_color: '#6b46c1',
    header_bg_color: '#322659',
    header_text_color: '#FFFFFF',
    category_header_color: '#553c9a',
  },
};

/**
 * Font family options for the dropdown.
 */
const FONT_OPTIONS = [
  { label: 'System UI', value: 'system-ui, -apple-system, sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Monospace', value: 'ui-monospace, "Cascadia Code", monospace' },
];

/**
 * Interface for the current user session.
 */
interface SessionUser {
  id: string;
  username: string;
  role: string;
}

export default function CustomizationPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewing, setPreviewing] = useState(false);

  // Check authentication
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user || null);
        setAuthLoading(false);
      })
      .catch(() => setAuthLoading(false));
  }, []);

  // Fetch current settings
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetch('/api/admin/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) {
            setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
            setSavedSettings({ ...DEFAULT_SETTINGS, ...data.settings });
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user]);

  /**
   * Apply settings to the page as a live preview by setting CSS variables.
   */
  const applyPreview = useCallback((s: Record<string, string>) => {
    const root = document.documentElement;
    root.style.setProperty('--header-bg', s.header_bg_color);
    root.style.setProperty('--header-text-color', s.header_text_color);
    root.style.setProperty('--category-header-bg', s.category_header_color);
    root.style.setProperty('--nav-bg', s.category_header_color);
    root.style.setProperty('--body-bg', s.background_color);
    root.style.setProperty('--background', s.background_color);
    root.style.setProperty('--content-bg', s.content_bg_color);
    root.style.setProperty('--sidebar-bg', s.content_bg_color);
    root.style.setProperty('--text-primary', s.text_color);
    root.style.setProperty('--foreground', s.text_color);
    root.style.setProperty('--link-color', s.link_color);
    root.style.setProperty('--accent-teal', s.secondary_color);
    root.style.setProperty('--primary-color', s.primary_color);
    root.style.setProperty('--secondary-color', s.secondary_color);
    root.style.setProperty('--accent-color', s.accent_color);
    root.style.setProperty('--forum-font-family', s.font_family);
    root.style.setProperty('--forum-font-size', s.font_size_base);
    root.style.setProperty('--forum-border-radius', s.border_radius);
    root.style.setProperty('--forum-content-width', s.content_width);
  }, []);

  /**
   * Revert preview to saved settings.
   */
  const revertPreview = useCallback(() => {
    applyPreview(savedSettings);
    setPreviewing(false);
  }, [savedSettings, applyPreview]);

  /**
   * Update a single setting.
   */
  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Apply a preset theme.
   */
  const applyPreset = (presetName: string) => {
    const preset = PRESET_THEMES[presetName];
    if (preset) {
      setSettings((prev) => ({ ...prev, ...preset }));
    }
  };

  /**
   * Save settings to the server.
   */
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings.' });
        setSaving(false);
        return;
      }

      setSavedSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      setPreviewing(false);
      setMessage({ type: 'success', text: 'Settings saved successfully. Reload the page to see full changes.' });

      // Apply the saved settings as CSS variables
      applyPreview(data.settings);
    } catch {
      setMessage({ type: 'error', text: 'Connection error. Please try again.' });
    }

    setSaving(false);
  };

  /**
   * Reset settings to defaults.
   */
  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to reset settings.' });
        setSaving(false);
        return;
      }

      setSavedSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      setPreviewing(false);
      setMessage({ type: 'success', text: 'Settings reset to defaults.' });
      applyPreview(data.settings);
    } catch {
      setMessage({ type: 'error', text: 'Connection error. Please try again.' });
    }

    setSaving(false);
  };

  /**
   * Preview changes without saving.
   */
  const handlePreview = () => {
    applyPreview(settings);
    setPreviewing(true);
    setMessage({ type: 'success', text: 'Preview applied. Changes are not saved yet.' });
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="forum-container" style={{ paddingTop: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    );
  }

  // Not logged in or not admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="forum-container" style={{ paddingTop: '24px' }}>
        <div style={{
          maxWidth: '500px',
          margin: '0 auto',
          padding: '32px',
          textAlign: 'center',
          background: 'var(--content-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--forum-border-radius)',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Access Denied
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            You must be an administrator to access this page.
          </p>
          <Link href="/" className="forum-btn">Return Home</Link>
        </div>
      </div>
    );
  }

  // Settings loading state
  if (loading) {
    return (
      <div className="forum-container" style={{ paddingTop: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div className="forum-container" style={{ paddingTop: '12px', paddingBottom: '24px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none' }}>Home</Link>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>&rsaquo;</span>
          <span style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: '500' }}>Admin Customization</span>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
          Forum Customization
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Customize the appearance and branding of your forum.
        </p>
      </div>

      {/* Status message */}
      {message && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--forum-border-radius)',
          marginBottom: '16px',
          fontSize: '13px',
          background: message.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          border: `1px solid ${message.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
          color: message.type === 'success' ? '#166534' : '#DC2626',
        }}>
          {message.text}
        </div>
      )}

      {/* Preview active notice */}
      {previewing && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--forum-border-radius)',
          marginBottom: '16px',
          fontSize: '13px',
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          color: '#92400E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>Preview mode active. Changes are not saved.</span>
          <button
            onClick={revertPreview}
            style={{
              background: 'none',
              border: '1px solid #92400E',
              color: '#92400E',
              padding: '4px 10px',
              borderRadius: 'var(--forum-border-radius)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Revert
          </button>
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Left column: Settings */}
        <div style={{ flex: '1', minWidth: 0 }}>
          {/* General Settings */}
          <SettingsSection title="General Settings">
            <SettingsField label="Forum Name">
              <input
                type="text"
                className="forum-input"
                value={settings.forum_name}
                onChange={(e) => updateSetting('forum_name', e.target.value)}
                maxLength={100}
              />
            </SettingsField>
            <SettingsField label="Forum Description">
              <input
                type="text"
                className="forum-input"
                value={settings.forum_description}
                onChange={(e) => updateSetting('forum_description', e.target.value)}
                maxLength={200}
              />
            </SettingsField>
            <SettingsField label="Logo Text">
              <input
                type="text"
                className="forum-input"
                value={settings.logo_text}
                onChange={(e) => updateSetting('logo_text', e.target.value)}
                maxLength={50}
              />
            </SettingsField>
          </SettingsSection>

          {/* Color Theme */}
          <SettingsSection title="Color Theme">
            {/* Preset themes */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Preset Themes
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {Object.keys(PRESET_THEMES).map((name) => (
                  <button
                    key={name}
                    onClick={() => applyPreset(name)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--forum-border-radius)',
                      background: 'var(--content-bg)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <span style={{
                      display: 'inline-block',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: PRESET_THEMES[name].header_bg_color,
                      marginRight: '6px',
                      verticalAlign: 'middle',
                    }} />
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Color pickers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <ColorPicker label="Primary Color" value={settings.primary_color} onChange={(v) => updateSetting('primary_color', v)} />
              <ColorPicker label="Secondary Color" value={settings.secondary_color} onChange={(v) => updateSetting('secondary_color', v)} />
              <ColorPicker label="Accent Color" value={settings.accent_color} onChange={(v) => updateSetting('accent_color', v)} />
              <ColorPicker label="Background Color" value={settings.background_color} onChange={(v) => updateSetting('background_color', v)} />
              <ColorPicker label="Content Background" value={settings.content_bg_color} onChange={(v) => updateSetting('content_bg_color', v)} />
              <ColorPicker label="Text Color" value={settings.text_color} onChange={(v) => updateSetting('text_color', v)} />
              <ColorPicker label="Link Color" value={settings.link_color} onChange={(v) => updateSetting('link_color', v)} />
              <ColorPicker label="Header Background" value={settings.header_bg_color} onChange={(v) => updateSetting('header_bg_color', v)} />
              <ColorPicker label="Header Text" value={settings.header_text_color} onChange={(v) => updateSetting('header_text_color', v)} />
              <ColorPicker label="Category Header" value={settings.category_header_color} onChange={(v) => updateSetting('category_header_color', v)} />
            </div>

            {/* Live preview strip */}
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Color Preview
              </label>
              <div style={{ display: 'flex', borderRadius: 'var(--forum-border-radius)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{ flex: 1, height: '32px', background: settings.header_bg_color }} title="Header" />
                <div style={{ flex: 1, height: '32px', background: settings.category_header_color }} title="Category Header" />
                <div style={{ flex: 1, height: '32px', background: settings.primary_color }} title="Primary" />
                <div style={{ flex: 1, height: '32px', background: settings.secondary_color }} title="Secondary" />
                <div style={{ flex: 1, height: '32px', background: settings.accent_color }} title="Accent" />
                <div style={{ flex: 1, height: '32px', background: settings.link_color }} title="Link" />
                <div style={{ flex: 1, height: '32px', background: settings.background_color, borderLeft: `1px solid ${settings.text_color}` }} title="Background" />
                <div style={{ flex: 1, height: '32px', background: settings.content_bg_color }} title="Content" />
                <div style={{ flex: 1, height: '32px', background: settings.text_color }} title="Text" />
              </div>
            </div>
          </SettingsSection>

          {/* Typography */}
          <SettingsSection title="Typography">
            <SettingsField label="Font Family">
              <select
                className="forum-input"
                value={settings.font_family}
                onChange={(e) => updateSetting('font_family', e.target.value)}
              >
                {FONT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </SettingsField>

            <SettingsField label={`Base Font Size: ${settings.font_size_base}`}>
              <input
                type="range"
                min="12"
                max="18"
                step="1"
                value={parseInt(settings.font_size_base)}
                onChange={(e) => updateSetting('font_size_base', `${e.target.value}px`)}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                <span>12px</span>
                <span>18px</span>
              </div>
            </SettingsField>

            <SettingsField label={`Border Radius: ${settings.border_radius}`}>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={parseInt(settings.border_radius)}
                onChange={(e) => updateSetting('border_radius', `${e.target.value}px`)}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                <span>0px (sharp)</span>
                <span>12px (rounded)</span>
              </div>
            </SettingsField>
          </SettingsSection>

          {/* Layout */}
          <SettingsSection title="Layout">
            <SettingsField label={`Content Width: ${settings.content_width}`}>
              <input
                type="range"
                min="900"
                max="1600"
                step="50"
                value={parseInt(settings.content_width)}
                onChange={(e) => updateSetting('content_width', `${e.target.value}px`)}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                <span>900px</span>
                <span>1600px</span>
              </div>
            </SettingsField>
          </SettingsSection>

          {/* Dark Mode */}
          <SettingsSection title="Dark Mode">
            <SettingsField label="Enable Dark Mode">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.dark_mode_enabled === 'true'}
                  onChange={(e) => updateSetting('dark_mode_enabled', e.target.checked ? 'true' : 'false')}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {settings.dark_mode_enabled === 'true' ? 'Dark mode is enabled' : 'Dark mode is disabled'}
                </span>
              </label>
            </SettingsField>

            {settings.dark_mode_enabled === 'true' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <ColorPicker label="Dark Background" value={settings.dark_bg_color} onChange={(v) => updateSetting('dark_bg_color', v)} />
                <ColorPicker label="Dark Content BG" value={settings.dark_content_bg} onChange={(v) => updateSetting('dark_content_bg', v)} />
                <ColorPicker label="Dark Text Color" value={settings.dark_text_color} onChange={(v) => updateSetting('dark_text_color', v)} />
                <ColorPicker label="Dark Header BG" value={settings.dark_header_bg} onChange={(v) => updateSetting('dark_header_bg', v)} />
              </div>
            )}
          </SettingsSection>

          {/* Custom CSS */}
          <SettingsSection title="Custom CSS">
            <SettingsField label="CSS Overrides">
              <textarea
                className="forum-textarea"
                value={settings.custom_css}
                onChange={(e) => updateSetting('custom_css', e.target.value)}
                placeholder="/* Add custom CSS rules here */&#10;.forum-container { }&#10;.category-header { }"
                style={{
                  minHeight: '120px',
                  fontFamily: 'ui-monospace, "Cascadia Code", monospace',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  tabSize: 2,
                }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Add custom CSS to override any forum styles. Use browser dev tools to find class names. Note: @import is blocked for security.
              </div>
            </SettingsField>
          </SettingsSection>

          {/* Action buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            padding: '16px 0',
            borderTop: '1px solid var(--border-light)',
            marginTop: '8px',
          }}>
            <button
              onClick={handleReset}
              disabled={saving}
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: '600',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--forum-border-radius)',
                background: 'var(--content-bg)',
                color: 'var(--text-primary)',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              Reset to Defaults
            </button>
            <button
              onClick={handlePreview}
              disabled={saving}
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: '600',
                border: '1px solid var(--accent-teal)',
                borderRadius: 'var(--forum-border-radius)',
                background: 'transparent',
                color: 'var(--accent-teal)',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="forum-btn"
              style={{
                padding: '10px 24px',
                fontSize: '14px',
                opacity: saving ? 0.6 : 1,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Right column: Live Preview */}
        <div style={{ width: '340px', flexShrink: 0, position: 'sticky', top: '16px' }}>
          <div style={{
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--forum-border-radius)',
            overflow: 'hidden',
            background: 'var(--content-bg)',
          }}>
            <div style={{
              background: 'var(--category-header-bg)',
              color: 'var(--category-header-text)',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Live Preview
            </div>
            <div style={{ padding: '0' }}>
              {/* Mini forum preview */}
              <PreviewPanel settings={settings} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/**
 * Section wrapper for grouping settings.
 */
function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--forum-border-radius)',
      overflow: 'hidden',
      marginBottom: '16px',
    }}>
      <div style={{
        background: 'var(--category-header-bg)',
        color: 'var(--category-header-text)',
        padding: '8px 12px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {title}
      </div>
      <div style={{ padding: '16px', background: 'var(--content-bg)' }}>
        {children}
      </div>
    </div>
  );
}


/**
 * Individual settings field with label.
 */
function SettingsField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: '600',
        color: 'var(--text-primary)',
        marginBottom: '4px',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}


/**
 * Color picker input with hex text display.
 */
function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--text-primary)',
        marginBottom: '4px',
      }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '36px',
            height: '32px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--forum-border-radius)',
            padding: '2px',
            cursor: 'pointer',
            background: 'var(--content-bg)',
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v) || v === '') {
              onChange(v);
            }
          }}
          maxLength={7}
          style={{
            flex: 1,
            padding: '6px 8px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--forum-border-radius)',
            fontSize: '12px',
            fontFamily: 'ui-monospace, monospace',
            background: 'var(--content-bg)',
            color: 'var(--text-primary)',
          }}
        />
      </div>
    </div>
  );
}


/**
 * Live preview panel showing a miniature forum layout.
 */
function PreviewPanel({ settings }: { settings: Record<string, string> }) {
  const isDark = settings.dark_mode_enabled === 'true';
  const bg = isDark ? settings.dark_bg_color : settings.background_color;
  const contentBg = isDark ? settings.dark_content_bg : settings.content_bg_color;
  const textColor = isDark ? settings.dark_text_color : settings.text_color;
  const headerBg = isDark ? settings.dark_header_bg : settings.header_bg_color;

  return (
    <div style={{ background: bg, minHeight: '400px' }}>
      {/* Mini header */}
      <div style={{
        background: headerBg,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          color: settings.header_text_color,
          fontSize: '13px',
          fontWeight: '700',
          letterSpacing: '0.3px',
          fontFamily: settings.font_family,
        }}>
          {settings.logo_text || 'FORUM'}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <span style={{ color: settings.header_text_color, fontSize: '10px', opacity: 0.7 }}>Home</span>
          <span style={{ color: settings.header_text_color, fontSize: '10px', opacity: 0.7 }}>Login</span>
        </div>
      </div>

      {/* Mini nav */}
      <div style={{ background: settings.category_header_color, padding: '4px 12px' }}>
        <span style={{ color: '#fff', fontSize: '9px', opacity: 0.8 }}>New Posts | Search</span>
      </div>

      {/* Content area */}
      <div style={{ padding: '8px' }}>
        {/* Category */}
        <div style={{
          borderRadius: `${settings.border_radius}`,
          overflow: 'hidden',
          marginBottom: '8px',
          border: `1px solid ${isDark ? '#333' : '#D1D5DB'}`,
        }}>
          <div style={{
            background: settings.category_header_color,
            color: '#fff',
            padding: '5px 8px',
            fontSize: '9px',
            fontWeight: '600',
            textTransform: 'uppercase',
            fontFamily: settings.font_family,
          }}>
            General Discussion
          </div>

          {/* Subforum rows */}
          {['Off-Topic', 'Random'].map((name) => (
            <div key={name} style={{
              padding: '6px 8px',
              background: contentBg,
              borderBottom: `1px solid ${isDark ? '#2a2a4a' : '#E5E7EB'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: settings.secondary_color,
                flexShrink: 0,
              }} />
              <div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: settings.link_color,
                  fontFamily: settings.font_family,
                }}>
                  {name}
                </div>
                <div style={{ fontSize: '8px', color: isDark ? '#888' : '#888' }}>
                  12 threads &middot; 45 posts
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mini thread preview */}
        <div style={{
          borderRadius: settings.border_radius,
          overflow: 'hidden',
          border: `1px solid ${isDark ? '#333' : '#D1D5DB'}`,
        }}>
          <div style={{
            background: settings.category_header_color,
            color: '#fff',
            padding: '5px 8px',
            fontSize: '9px',
            fontWeight: '600',
            textTransform: 'uppercase',
            fontFamily: settings.font_family,
          }}>
            Sample Thread
          </div>

          <div style={{
            padding: '8px',
            background: contentBg,
          }}>
            <div style={{
              fontSize: '10px',
              color: textColor,
              fontFamily: settings.font_family,
              lineHeight: '1.5',
            }}>
              <p style={{ margin: '0 0 6px 0' }}>
                This is a preview of how forum content will look with the current settings.
              </p>
              <p style={{ margin: 0, color: settings.link_color, fontSize: '9px' }}>
                Links will look like this.
              </p>
            </div>
          </div>
        </div>

        {/* Mini button preview */}
        <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
          <div style={{
            padding: '4px 8px',
            background: settings.category_header_color,
            color: '#fff',
            borderRadius: settings.border_radius,
            fontSize: '9px',
            fontWeight: '600',
          }}>
            Button
          </div>
          <div style={{
            padding: '4px 8px',
            background: settings.secondary_color,
            color: '#fff',
            borderRadius: settings.border_radius,
            fontSize: '9px',
            fontWeight: '600',
          }}>
            Secondary
          </div>
          <div style={{
            padding: '4px 8px',
            background: settings.accent_color,
            color: '#fff',
            borderRadius: settings.border_radius,
            fontSize: '9px',
            fontWeight: '600',
          }}>
            Accent
          </div>
        </div>
      </div>

      {/* Mini footer */}
      <div style={{
        background: headerBg,
        padding: '6px 12px',
        marginTop: '8px',
      }}>
        <span style={{ color: settings.header_text_color, fontSize: '8px', opacity: 0.5 }}>
          {settings.forum_name} &mdash; Preview
        </span>
      </div>
    </div>
  );
}
