import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="breadcrumb">
      {items.map((item, index) => (
        <span key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {index > 0 && <span style={{ color: 'var(--text-muted)' }}>&rsaquo;</span>}
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
