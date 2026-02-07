/**
 * Shared utility functions for the forum.
 */

/**
 * Format a number into a human-readable short form (e.g., 1.3K, 2.5M).
 */
export function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1_000) {
    return (count / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
}

/**
 * Format a date string into a relative time (e.g., "5 minutes ago", "2 hours ago").
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr + 'Z'); // Treat as UTC
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
}

/**
 * Format a date string into a readable format (e.g., "Jan 15, 2024").
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'Z');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date string into a full timestamp (e.g., "Jan 15, 2024 at 3:45 PM").
 */
export function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr + 'Z');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Generate a deterministic color from a string (for auto-generated avatars).
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 55%, 45%)`;
}

/**
 * Escape HTML to prevent XSS when rendering user content.
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Simple text-to-HTML converter that handles basic formatting:
 * - Newlines become <br>
 * - **bold** text
 * - *italic* text
 * - URLs become links
 * - Lines starting with > become blockquotes
 */
export function renderPostContent(text: string): string {
  // First escape HTML
  let html = escapeHtml(text);

  // Convert **bold** (must come before single *)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Convert *italic*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Convert URLs to links
  html = html.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Convert lines starting with > to blockquotes
  const lines = html.split('\n');
  let inQuote = false;
  const processedLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('&gt; ') || line === '&gt;') {
      if (!inQuote) {
        processedLines.push('<blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin: 8px 0; color: #666;">');
        inQuote = true;
      }
      processedLines.push(line.replace(/^&gt;\s?/, '') + '<br>');
    } else {
      if (inQuote) {
        processedLines.push('</blockquote>');
        inQuote = false;
      }
      processedLines.push(line);
    }
  }
  if (inQuote) {
    processedLines.push('</blockquote>');
  }

  html = processedLines.join('\n');

  // Convert remaining newlines to <br>
  html = html.replace(/\n/g, '<br>');

  return html;
}
