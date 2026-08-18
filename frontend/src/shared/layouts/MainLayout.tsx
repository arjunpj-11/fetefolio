import { CalendarDays, Home, LogOut, Search, Ticket } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store';
import { useFilterStore } from '../../features/services/store';
import { useAvailableServiceTypes } from '../../features/services/hooks/useServices';
import { getServiceTypeIcon } from '../../features/services/components/ServiceTypeIcon';
import { BrandLogo } from '../components/BrandLogo';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function MainLayout() {
  const { user, clearAuth } = useAuthStore();
  const setFilter = useFilterStore((state) => state.setFilter);
  const startDate = useFilterStore((state) => state.startDate);
  const endDate = useFilterStore((state) => state.endDate);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const location = useLocation();
  const activeCategory = new URLSearchParams(location.search).get('category');
  const serviceTypes = useAvailableServiceTypes(startDate, endDate);
  const categoryLinks = serviceTypes.data ?? [];

  return (
    <div className="public-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-header__inner">
          <Link className="wordmark" to="/" aria-label="Fetefolio home">
            <BrandLogo />
          </Link>
          <nav className="desktop-account-nav" aria-label="Account">
            <NavLink to="/" end>
              Discover
            </NavLink>
            {user?.role === 'user' && <NavLink to="/bookings">Bookings</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin">Call sheet</NavLink>}
            {user ? (
              <button onClick={() => setConfirmSignOut(true)}>
                <LogOut /> Sign out
              </button>
            ) : (
              <Link className="nav-cta" to="/login">
                Sign in <CalendarDays />
              </Link>
            )}
          </nav>
        </div>
        <nav
          className={`category-nav ${location.pathname === '/' ? 'category-nav--home' : ''}`}
          aria-label="Service categories"
        >
          <div>
            {categoryLinks.length === 0 && !serviceTypes.isLoading ? (
              <span className="category-nav__empty">
                No services are available for the selected dates.
              </span>
            ) : (
              categoryLinks.map((category) => {
                const isActive =
                  location.pathname === '/services' && activeCategory === category.slug;
                const Icon = getServiceTypeIcon(category.icon);
                const params = new URLSearchParams({ category: category.slug });
                if (startDate) params.set('startDate', startDate);
                if (endDate) params.set('endDate', endDate);
                return (
                  <Link
                    key={category.slug}
                    className={isActive ? 'active' : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    to={`/services?${params.toString()}`}
                    onClick={() => {
                      setFilter('category', category.slug);
                      setFilter('search', '');
                    }}
                  >
                    <Icon />
                    <span>{category.label}</span>
                  </Link>
                );
              })
            )}
          </div>
        </nav>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div>
          <Link className="wordmark wordmark--footer" to="/" aria-label="Fetefolio home">
            <BrandLogo showTagline={false} />
          </Link>
          <p>Remarkable gatherings, beautifully arranged.</p>
        </div>
        <div className="site-footer__meta">
          <span>
            {categoryLinks.length > 0
              ? categoryLinks.map((type) => type.label.toUpperCase()).join(' · ')
              : 'EVENT SERVICES, BEAUTIFULLY ARRANGED'}
          </span>
          <span>© {new Date().getFullYear()} FETEFOLIO</span>
        </div>
      </footer>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <NavLink to="/" end>
          <Home />
          <span>Home</span>
        </NavLink>
        <Link to="/#service-categories">
          <Search />
          <span>Categories</span>
        </Link>
        {user?.role === 'user' && (
          <NavLink to="/bookings">
            <CalendarDays />
            <span>Bookings</span>
          </NavLink>
        )}
        {user?.role === 'admin' && (
          <NavLink to="/admin">
            <Ticket />
            <span>Admin</span>
          </NavLink>
        )}
        {!user && (
          <NavLink to="/login">
            <CalendarDays />
            <span>Sign in</span>
          </NavLink>
        )}
        {user && (
          <button type="button" onClick={() => setConfirmSignOut(true)}>
            <LogOut />
            <span>Sign out</span>
          </button>
        )}
      </nav>
      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out?"
        message="You will need to sign in again to manage your bookings and account."
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
