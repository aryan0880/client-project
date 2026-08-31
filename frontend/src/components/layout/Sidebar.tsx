import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart2,
  LogOut,
  Menu,
  X,
  Building2,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../store/AuthContext';
import { getInitials } from '../../utils/formatters';

const navItems = [
  { to: '/dashboard',   label: 'Dashboard',  Icon: LayoutDashboard },
  { to: '/suppliers',   label: 'Suppliers',   Icon: Users },
  { to: '/surveys',     label: 'Surveys',     Icon: ClipboardList },
  { to: '/reports',     label: 'Reports',     Icon: BarChart2 },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-neutral-200">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary-600">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900 leading-none">SupplierAssess</p>
          <p className="text-xs text-neutral-500 mt-0.5">Management Portal</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1 text-neutral-400 hover:text-neutral-600 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              clsx('nav-item', isActive && 'active')
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-neutral-200 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex-shrink-0">
            {user ? getInitials(user.name) : 'AU'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {user?.name ?? 'Admin User'}
            </p>
            <p className="text-xs text-neutral-500 truncate">{user?.email ?? ''}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-sidebar bg-white border-r border-neutral-200 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-sidebar bg-white border-r border-neutral-200',
          'transform transition-transform duration-200 ease-in-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent onClose={onMobileClose} />
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded lg:hidden"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
