/**
 * Forum settings library.
 * Provides functions to read and write forum customization settings
 * stored in the forum_settings table.
 */

import { getDb } from './db';

/**
 * Default settings for the forum. Used during initial seeding
 * and when resetting to defaults.
 */
export const DEFAULT_SETTINGS: Record<string, string> = {
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
 * Fetch all forum settings as a key-value object.
 */
export function getSettings(): Record<string, string> {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM forum_settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  // Fill in any missing keys with defaults
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (!(key in settings)) {
      settings[key] = value;
    }
  }
  return settings;
}

/**
 * Update multiple settings at once.
 * Only updates keys that exist in DEFAULT_SETTINGS to prevent arbitrary data injection.
 */
export function updateSettings(settings: Record<string, string>): void {
  const db = getDb();
  const upsert = db.prepare(`
    INSERT INTO forum_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);

  const transaction = db.transaction(() => {
    for (const [key, value] of Object.entries(settings)) {
      if (key in DEFAULT_SETTINGS) {
        upsert.run(key, value);
      }
    }
  });

  transaction();
}

/**
 * Reset all settings to their default values.
 */
export function resetSettings(): void {
  const db = getDb();
  const upsert = db.prepare(`
    INSERT INTO forum_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);

  const transaction = db.transaction(() => {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      upsert.run(key, value);
    }
  });

  transaction();
}

