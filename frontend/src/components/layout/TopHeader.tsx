import React from 'react';
import { Search } from 'lucide-react';
import { MobileMenuButton } from './Sidebar';

interface TopHeaderProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  onMobileMenuOpen: () => void;
  action?: React.ReactNode;
}

export function TopHeader({
  title,
  subtitle,
  showSearch = false,
  onMobileMenuOpen,
  action,
}: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
      <div className="flex items-center gap-4 px-5 h-header">
        <MobileMenuButton onClick={onMobileMenuOpen} />

        {/* Page title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-neutral-900 truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-neutral-500 hidden sm:block">{subtitle}</p>
          )}
        </div>

        {/* Search */}
        {showSearch && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded text-sm text-neutral-400 w-56 cursor-text hover:border-neutral-300 transition-colors">
            <Search className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Search…</span>
          </div>
        )}

        {/* Page-level action */}
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </header>
  );
}
