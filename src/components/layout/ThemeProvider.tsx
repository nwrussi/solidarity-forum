'use client';

import { useEffect, useState } from 'react';

/**
 * Theme settings shape returned from /api/settings/theme
 */
interface ThemeSettings {
  forum_name: string;
  forum_description: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  content_bg_color: string;
  text_color: string;
  link_color: string;
  header_bg_color: string;
  header_text_color: string;
  category_header_color: string;
  font_family: string;
  font_size_base: string;
  border_radius: string;
  content_width: string;
  logo_text: string;
  custom_css: string;
  dark_mode_enabled: string;
  dark_bg_color: string;
  dark_content_bg: string;
  dark_text_color: string;
  dark_header_bg: string;
}

/**
 * Map of theme setting keys to CSS variable names.
 * This controls which settings are applied as CSS custom properties.
 */
const SETTING_TO_CSS_VAR: Record<string, string> = {
  primary_color: '--primary-color',
  secondary_color: '--secondary-color',
  accent_color: '--accent-color',
  background_color: '--body-bg',
  content_bg_color: '--content-bg',
  text_color: '--text-primary',
  link_color: '--link-color',
  header_bg_color: '--header-bg',
  header_text_color: '--header-text-color',
  category_header_color: '--category-header-bg',
  font_family: '--forum-font-family',
  font_size_base: '--forum-font-size',
  border_radius: '--forum-border-radius',
  content_width: '--forum-content-width',
};

/**
 * Derive secondary CSS variables from the main theme colors.
 * These are computed variations that rely on the primary settings.
 */
function applyDerivedVariables(settings: ThemeSettings): void {
  const root = document.documentElement;

  // Header darker variant (used in some gradients)
  root.style.setProperty('--header-bg-dark', darkenColor(settings.header_bg_color, 15));

  // Nav background (slightly lighter than header)
  root.style.setProperty('--nav-bg', lightenColor(settings.category_header_color, 0));
  root.style.setProperty('--nav-hover', lightenColor(settings.category_header_color, 15));

  // Accent colors derived from secondary
  root.style.setProperty('--accent-teal', settings.secondary_color);

  // Link hover (darker variant of link color)
  root.style.setProperty('--link-hover', darkenColor(settings.link_color, 15));

  // Text secondary and muted derived from text color
  root.style.setProperty('--text-secondary', lightenColor(settings.text_color, 20));
  root.style.setProperty('--text-muted', lightenColor(settings.text_color, 40));

  // Sidebar bg matches content bg
  root.style.setProperty('--sidebar-bg', settings.content_bg_color);

  // Background/foreground aliases
  root.style.setProperty('--background', settings.background_color);
  root.style.setProperty('--foreground', settings.text_color);

  // Category header text is always white for readability
  root.style.setProperty('--category-header-text', '#FFFFFF');
}

/**
 * Apply dark mode overrides when dark mode is enabled.
 */
function applyDarkMode(settings: ThemeSettings): void {
  const root = document.documentElement;
  root.style.setProperty('--body-bg', settings.dark_bg_color);
  root.style.setProperty('--content-bg', settings.dark_content_bg);
  root.style.setProperty('--sidebar-bg', settings.dark_content_bg);
  root.style.setProperty('--text-primary', settings.dark_text_color);
  root.style.setProperty('--text-secondary', lightenColor(settings.dark_text_color, -10));
  root.style.setProperty('--text-muted', lightenColor(settings.dark_text_color, -25));
  root.style.setProperty('--header-bg', settings.dark_header_bg);
  root.style.setProperty('--header-bg-dark', darkenColor(settings.dark_header_bg, 10));
  root.style.setProperty('--background', settings.dark_bg_color);
  root.style.setProperty('--foreground', settings.dark_text_color);
  root.style.setProperty('--border-color', '#2a2a4a');
  root.style.setProperty('--border-light', '#1e1e3e');
  root.style.setProperty('--link-color', '#5dade2');
  root.style.setProperty('--link-hover', '#85c1e9');
}

/**
 * Simple color manipulation: darken a hex color by a percentage.
 */
function darkenColor(hex: string, percent: number): string {
  return adjustColor(hex, -percent);
}

/**
 * Simple color manipulation: lighten a hex color by a percentage.
 */
function lightenColor(hex: string, percent: number): string {
  return adjustColor(hex, percent);
}

/**
 * Adjust a hex color's brightness by a percentage (-100 to 100).
 */
function adjustColor(hex: string, percent: number): string {
  // Clean hex
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const num = parseInt(hex, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;

  const amount = Math.round(2.55 * percent);
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));

  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Apply custom CSS from settings by injecting a <style> tag.
 */
function applyCustomCSS(css: string): void {
  const existingStyle = document.getElementById('forum-custom-css');
  if (existingStyle) {
    existingStyle.remove();
  }

  if (css && css.trim()) {
    const style = document.createElement('style');
    style.id = 'forum-custom-css';
    style.textContent = css;
    document.head.appendChild(style);
  }
}

/**
 * ThemeProvider component.
 * Fetches theme settings from the public API and applies them as CSS variables.
 * Renders nothing visible -- it only manages CSS custom properties on the document root.
 */
export default function ThemeProvider() {
  const [, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/settings/theme')
      .then((res) => res.json())
      .then((data) => {
        if (data.theme) {
          const theme = data.theme as ThemeSettings;
          const root = document.documentElement;

          // Apply direct CSS variable mappings
          for (const [settingKey, cssVar] of Object.entries(SETTING_TO_CSS_VAR)) {
            const value = theme[settingKey as keyof ThemeSettings];
            if (value) {
              root.style.setProperty(cssVar, value);
            }
          }

          // Apply derived variables
          applyDerivedVariables(theme);

          // Apply dark mode overrides if enabled
          if (theme.dark_mode_enabled === 'true') {
            applyDarkMode(theme);
          }

          // Apply custom CSS
          applyCustomCSS(theme.custom_css);

          setLoaded(true);
        }
      })
      .catch((err) => {
        console.error('Failed to load theme settings:', err);
      });
  }, []);

  return null;
}
