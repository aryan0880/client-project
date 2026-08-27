import { Outlet } from 'react-router-dom';

/** Minimal layout for public-facing pages (supplier survey). */
export function PublicLayout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Outlet />
    </div>
  );
}
