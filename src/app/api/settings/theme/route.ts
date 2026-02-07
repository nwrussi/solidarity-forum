import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';

/**
 * GET /api/settings/theme
 * Public route that returns the current theme settings for applying styles.
 * No authentication required -- the theme must be available to all visitors.
 */
export async function GET() {
  try {
    const settings = getSettings();

    // Return only theme-relevant settings (not sensitive admin data)
    const theme = {
      forum_name: settings.forum_name,
      forum_description: settings.forum_description,
      primary_color: settings.primary_color,
      secondary_color: settings.secondary_color,
      accent_color: settings.accent_color,
      background_color: settings.background_color,
      content_bg_color: settings.content_bg_color,
      text_color: settings.text_color,
      link_color: settings.link_color,
      header_bg_color: settings.header_bg_color,
      header_text_color: settings.header_text_color,
      category_header_color: settings.category_header_color,
      font_family: settings.font_family,
      font_size_base: settings.font_size_base,
      border_radius: settings.border_radius,
      content_width: settings.content_width,
      logo_text: settings.logo_text,
      custom_css: settings.custom_css,
      dark_mode_enabled: settings.dark_mode_enabled,
      dark_bg_color: settings.dark_bg_color,
      dark_content_bg: settings.dark_content_bg,
      dark_text_color: settings.dark_text_color,
      dark_header_bg: settings.dark_header_bg,
    };

    return NextResponse.json({ theme });
  } catch (error) {
    console.error('Error fetching theme settings:', error);
    return NextResponse.json(
      { error: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}
