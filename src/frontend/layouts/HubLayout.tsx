import type { CSSProperties } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { colors, glows, typography } from '../../shared/design/tokens';
import { FeatureAccessKey } from '../../shared/types';
import { selectAccessMap, useAuthStore } from '../store/auth';

const navItems = [
  { label: 'Hub', to: '/', testId: 'nav-hub' },
  { label: 'Academia', to: '/academy', testId: 'nav-academy', feature: FeatureAccessKey.Academy },
  { label: 'Hidra', to: '/hidra', testId: 'nav-hidra', feature: FeatureAccessKey.Hidra },
  { label: 'Cybervault', to: '/cybervault', testId: 'nav-cybervault', feature: FeatureAccessKey.Cybervault },
  { label: 'Admin', to: '/admin', testId: 'nav-admin', feature: FeatureAccessKey.Admin },
] as const;

const linkStyles: CSSProperties = {
  fontFamily: typography.fontHeading,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
};

export const HubLayout = () => {
  const accessMap = useAuthStore(selectAccessMap);
  return (
    <div
      className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]"
      style={{ '--app-bg': colors.bgPrimary, '--app-text': colors.textPrimary } as CSSProperties}
    >
      <header
        className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/80 backdrop-blur"
        style={{
          '--border-color': colors.borderPrimary,
          '--bg-elevated': colors.bgElevated,
        } as CSSProperties}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span
            className="text-lg font-semibold uppercase"
            style={{ fontFamily: typography.fontHeading, letterSpacing: '0.2em', color: colors.primary, textShadow: glows.sm }}
          >
            SiderHub
          </span>
          <nav className="flex gap-4 text-xs">
            {navItems.map((item) => {
              const featureAccess = item.feature
                ? accessMap.find((entry) => entry.feature === item.feature)
                : { enabled: true };
              const disabled = item.feature ? !featureAccess?.enabled : false;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  data-testid={item.testId}
                  aria-disabled={disabled}
                  className={({ isActive }) =>
                    [
                      'rounded-full px-4 py-2 transition-transform',
                      isActive ? 'text-[var(--active-color)] shadow-[var(--glow)]' : 'text-[var(--inactive-color)] hover:-translate-y-0.5',
                      disabled ? 'pointer-events-none opacity-40' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')
                  }
                  style={{
                    ...linkStyles,
                    '--inactive-color': colors.textSecondary,
                    '--active-color': colors.primary,
                    '--glow': glows.sm,
                  } as CSSProperties}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
};

export default HubLayout;
