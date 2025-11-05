import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { colors, typography } from '../../shared/design/tokens';
import type { FeatureAccessKey } from '../../shared/types';
import { selectAccessMap, selectIsAuthenticated, useAuthStore } from '../store/auth';

interface ProtectedRouteProps {
  children?: ReactNode;
  redirectTo?: string;
  requiredFeature?: FeatureAccessKey;
  fallback?: ReactNode;
}

const LoadingScreen = () => (
  <div
    className="flex min-h-screen items-center justify-center"
    style={{
      backgroundColor: colors.bgPrimary,
      color: colors.textSecondary,
      fontFamily: typography.fontHeading,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
    }}
  >
    Carregando interface neon...
  </div>
);

export const ProtectedRoute = ({
  children,
  redirectTo = '/login',
  requiredFeature,
  fallback = <LoadingScreen />,
}: ProtectedRouteProps) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const accessMap = useAuthStore(selectAccessMap);
  const hydratedAt = useAuthStore((state) => state.hydratedAt);
  const isAuthLoading = useAuthStore((state) => state.isLoading);

  const isHydrated = Boolean(hydratedAt);

  if (!isHydrated || isAuthLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (requiredFeature) {
    const featureAccess = accessMap.find((entry) => entry.feature === requiredFeature);
    if (!featureAccess || !featureAccess.enabled) {
      return <Navigate to="/" replace />;
    }
  }

  if (children) {
    return <>{children}</>;
  }

  return <Outlet />;
};

export default ProtectedRoute;
