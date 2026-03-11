'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/nichos', label: 'Nichos' },
  { href: '/videos', label: 'Vídeos' },
  { href: '/configuracoes', label: 'Configurações' }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-slate-200 bg-white p-4 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="mb-6 text-lg font-bold text-slate-900">Analyzer Admin</div>
      <nav className="grid gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-lg px-3 py-2 text-sm transition-colors',
              pathname.startsWith(link.href)
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
