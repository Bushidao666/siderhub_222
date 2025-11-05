import type { CSSProperties } from 'react';
import { Outlet } from 'react-router-dom';

import { colors, glows, typography } from '../../shared/design/tokens';

export const AuthLayout = () => {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4 py-10"
      style={{ '--bg-primary': colors.bgPrimary } as CSSProperties}
    >
      <div className="w-full max-w-lg space-y-6">
        <header className="text-center">
          <p
            className="text-xs uppercase tracking-[0.28em]"
            style={{ fontFamily: typography.fontHeading, color: colors.textSecondary }}
          >
            Portal Blacksider Society
          </p>
          <h1
            className="mt-2 text-3xl uppercase"
            style={{ fontFamily: typography.fontHeading, color: colors.primary, textShadow: glows.text }}
          >
            Bem-vindo ao SiderHub
          </h1>
        </header>
        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-8 shadow-[var(--shadow)]"
          style={{
            '--border-color': colors.borderPrimary,
            '--bg-secondary': colors.bgSecondary,
            '--shadow': glows.md,
          } as CSSProperties}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
