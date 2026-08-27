import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';

/**
 * AdminLayout wraps all authenticated pages.
 * The page title/subtitle are passed down via context in Phase 2;
 * for Phase 1, individual pages render their own headers via useOutletContext.
 */
export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header is rendered by child pages using useOutletContext or directly */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-neutral-200 px-4 h-14 flex items-center">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-3 font-semibold text-neutral-900 text-sm">SupplierAssess</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ setMobileOpen }} />
        </main>
      </div>
    </div>
  );
}
