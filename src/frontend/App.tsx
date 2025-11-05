import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { FeatureAccessKey } from '../shared/types';
import { AcademyDashboard } from './pages/Academy/Dashboard';
import { CourseDetail } from './pages/Academy/CourseDetail';
import { LessonDetail } from './pages/Academy/LessonDetail';
import { AdminBanners } from './pages/Admin/Banners';
import { AdminDashboard } from './pages/Admin/Dashboard';
import { AdminMembers } from './pages/Admin/Members';
import { CybervaultDetail } from './pages/Cybervault/ResourceDetail';
import { CybervaultLibrary } from './pages/Cybervault/ResourceLibrary';
import { HidraCampaignCreate } from './pages/Hidra/CampaignCreate';
import { HidraCampaigns } from './pages/Hidra/Campaigns';
import { HidraDashboard } from './pages/Hidra/Dashboard';
import { HidraWizard } from './pages/Hidra/Wizard';
import { HidraConfig } from './pages/Hidra/Config';
import { HubHome } from './pages/Hub/Home';
import { Login } from './pages/Auth/Login';
import { HydrationBoundary, HydrationState, getQueryClient, hydrateQueryClient } from './lib/queryClient';
import { selectIsAuthenticated, useAuthStore } from './store/auth';
import { AdminLayout, AuthLayout, HubLayout } from './layouts';
import { ProtectedRoute } from './routes/ProtectedRoute';

interface AppProps {
  initialQueryState?: HydrationState;
}

function App({ initialQueryState }: AppProps = {}) {
  const hydrate = useAuthStore((state) => state.hydrateFromStorage);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const client = getQueryClient();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    hydrateQueryClient(client, initialQueryState);
  }, [client, initialQueryState]);

  return (
    <QueryClientProvider client={client}>
      <HydrationBoundary state={initialQueryState}>
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<AuthLayout />}>
            <Route
              index
              element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
            />
          </Route>

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HubLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HubHome />} />
            <Route path="academy" element={<AcademyDashboard />} />
            <Route path="academy/courses/:courseId" element={<CourseDetail />} />
            <Route path="academy/lessons/:lessonId" element={<LessonDetail />} />
            <Route path="hidra" element={<HidraDashboard />} />
            <Route path="hidra/campaigns" element={<HidraCampaigns />} />
            <Route path="hidra/campaigns/create" element={<HidraCampaignCreate />} />
            <Route path="hidra/campaigns/wizard" element={<HidraWizard />} />
            <Route path="hidra/config" element={<HidraConfig />} />
            <Route path="cybervault" element={<CybervaultLibrary />} />
            <Route path="cybervault/:resourceSlug" element={<CybervaultDetail />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredFeature={FeatureAccessKey.Admin}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="members" element={<AdminMembers />} />
          </Route>

          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />}
          />
          </Routes>
        </BrowserRouter>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}

export default App;
