import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getSettings, updateSettings, resetSettings } from '@/lib/settings';

/**
 * GET /api/admin/settings
 * Returns all forum settings. Admin only.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const settings = getSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/settings
 * Update forum settings. Admin only.
 * Accepts a JSON body with key-value pairs to update.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings, action } = body;

    // Handle reset action
    if (action === 'reset') {
      resetSettings();
      const updatedSettings = getSettings();
      return NextResponse.json({ success: true, settings: updatedSettings });
    }

    // Validate settings is an object
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Settings must be a JSON object of key-value pairs.' },
        { status: 400 }
      );
    }

    // Validate all values are strings
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value !== 'string') {
        return NextResponse.json(
          { error: `Invalid value for setting "${key}". All values must be strings.` },
          { status: 400 }
        );
      }
    }

    // Sanitize custom_css to prevent script injection
    if (settings.custom_css !== undefined) {
      const css = settings.custom_css as string;
      // Remove any potential script injection via CSS expressions or javascript: URLs
      const sanitized = css
        .replace(/expression\s*\(/gi, '')
        .replace(/javascript\s*:/gi, '')
        .replace(/@import/gi, '/* @import blocked */');
      settings.custom_css = sanitized;
    }

    updateSettings(settings as Record<string, string>);
    const updatedSettings = getSettings();
    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}
