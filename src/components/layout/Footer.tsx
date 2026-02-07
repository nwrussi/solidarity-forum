import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--header-bg)', color: 'var(--header-text-color)', marginTop: '24px', opacity: 0.9 }}>
      <div className="forum-container">
        <div style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Home</Link>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Terms and Conditions</Link>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Privacy Policy</Link>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Help</Link>
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 0', fontSize: '11px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          Solidarity Forum &mdash; Anonymous community platform. No email required. No tracking. No analytics.
        </div>
      </div>
    </footer>
  );
}
