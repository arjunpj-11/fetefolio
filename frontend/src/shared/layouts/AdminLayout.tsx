import { ArrowLeft, CalendarCheck, LayoutDashboard, Layers3, LogOut, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store';
import { BrandLogo } from '../components/BrandLogo';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function AdminLayout() {
  const { user, clearAuth } = useAuthStore();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin" aria-label="Fetefolio admin home">
          <BrandLogo showTagline={false} />
        </Link>
        <nav className="admin-nav">
          <NavLink to="/admin" end>
            <LayoutDashboard /> Overview
          </NavLink>
          <NavLink to="/admin/services">
            <Layers3 /> Services
          </NavLink>
          <NavLink to="/admin/bookings">
            <CalendarCheck /> Bookings
          </NavLink>
          <NavLink className="admin-nav__new" to="/admin/services/new">
            <Plus /> Add service
          </NavLink>
        </nav>
        <div className="admin-user">
          <span className="availability-dot" />
          <div>
            <strong>{user?.name}</strong>
            <small>{user?.email}</small>
          </div>
        </div>
        <div className="admin-sidebar__actions">
          <Link to="/">
            <ArrowLeft /> Public site
          </Link>
          <button onClick={() => setConfirmSignOut(true)}>
            <LogOut /> Sign out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
      <nav className="admin-mobile-nav">
        <NavLink to="/admin" end>
          <LayoutDashboard />
          <span>Overview</span>
        </NavLink>
        <NavLink to="/admin/services">
          <Layers3 />
          <span>Services</span>
        </NavLink>
        <NavLink to="/admin/services/new">
          <Plus />
          <span>Add</span>
        </NavLink>
        <NavLink to="/admin/bookings">
          <CalendarCheck />
          <span>Bookings</span>
        </NavLink>
        <button type="button" onClick={() => setConfirmSignOut(true)}>
          <LogOut />
          <span>Sign out</span>
        </button>
      </nav>
      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out of admin?"
        message="You will need to sign in again before managing services or bookings."
        confirmLabel="Sign out"
        tone="danger"
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={() => {
          clearAuth();
          setConfirmSignOut(false);
        }}
      />
    </div>
  );
}
