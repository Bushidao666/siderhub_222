import type { CSSProperties } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { colors, glows, typography } from '../../shared/design/tokens';

const adminNav = [
  { label: 'Dashboard', to: '/admin', testId: 'admin-nav-dashboard' },
  { label: 'Banners', to: '/admin/banners', testId: 'admin-nav-banners' },
  { label: 'Membros', to: '/admin/members', testId: 'admin-nav-members' },
] as const;

export const AdminLayout = () => {
  return (
    <div
      className="grid min-h-screen grid-cols-[260px_1fr] grid-rows-[auto_1fr]"
      style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}
    >
      <aside
        className="col-span-1 row-span-2 flex flex-col gap-6 border-r border-[var(--border-color)] bg-[var(--bg-elevated)] px-6 py-8"
        style={{ '--border-color': colors.borderPrimary, '--bg-elevated': colors.bgSecondary } as CSSProperties}
      >
        <div>
          <p
            className="text-sm uppercase tracking-[0.2em]"
            style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}
          >
            Painel Admin
          </p>
          <h1
            className="mt-2 text-2xl uppercase"
            style={{ fontFamily: typography.fontHeading, color: colors.primary, textShadow: glows.sm }}
          >
            Blacksider
          </h1>
        </div>
        <nav className="flex flex-col gap-2 text-xs">
          {adminNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={item.testId}
              className={({ isActive }) =>
                [
                  'rounded-full px-4 py-2 transition-colors',
                  isActive
                    ? 'bg-[var(--active-bg)] text-[var(--active-text)] shadow-[var(--glow)]'
                    : 'text-[var(--inactive-text)] hover:bg-[var(--hover-bg)]',
                ].join(' ')
              }
              style={{
                fontFamily: typography.fontHeading,
                letterSpacing: '0.16em',
                '--active-bg': colors.primaryGlow,
                '--active-text': colors.textPrimary,
                '--inactive-text': colors.textSecondary,
                '--hover-bg': colors.bgTertiary,
                '--glow': glows.sm,
              } as CSSProperties}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="col-start-2 row-start-1 row-end-3 px-10 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
