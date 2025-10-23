import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import HomePage from './pages/HomePage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import { UserRole } from './types';
import { FeedbackProvider } from './hooks/useFeedback';

// Lazy-loaded pages to reduce initial bundle size
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const OnboardingPage = React.lazy(() => import('./pages/OnboardingPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const CalendarPage = React.lazy(() => import('./pages/CalendarPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const SuperAdminPage = React.lazy(() => import('./pages/SuperAdminPage'));
const SupportPage = React.lazy(() => import('./pages/SupportPage'));
const ConversationsPage = React.lazy(() => import('./pages/ConversationsPage'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));

const PrivateRoute: React.FC<{ children: React.ReactElement; roles?: UserRole[] }> = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('[RouteGuard] check', {
    path: location.pathname,
    loading,
    hasUser: !!user,
    onboardingCompleted: !!(user as any)?.onboarding_completed,
    role: (user as any)?.role,
  });

  if (loading) {
    console.log('[RouteGuard] loading=true, exibindo spinner.');
    return <div className="flex justify-center items-center h-screen"><p>Carregando...</p></div>;
  }

  if (!user) {
    console.warn('[RouteGuard] Usuário ausente; redirecionando para /login');
    return <Navigate to="/login" />;
  }
  
  if (!(user as any).onboarding_completed && location.pathname !== '/onboarding') {
    console.warn('[RouteGuard] Onboarding pendente; redirecionando para /onboarding');
    return <Navigate to="/onboarding" />;
  }

  if (roles && !(roles as any).includes((user as any).role)) {
    console.warn('[RouteGuard] Role sem permissão; redirecionando para /dashboard');
    return <Navigate to="/dashboard" />;
  }

  console.log('[RouteGuard] Acesso concedido a', location.pathname);
  return children;
};

const AppRoutes: React.FC = () => {
  return (
    <React.Suspense fallback={<div className="flex justify-center items-center h-screen"><p>Carregando tela...</p></div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/support" element={<SupportPage />} />

        <Route path="/onboarding" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/conversations" element={<PrivateRoute><ConversationsPage /></PrivateRoute>} />
          <Route path="/chat/:id" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
          <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          <Route path="/super-admin" element={<PrivateRoute roles={[UserRole.SUPER_ADMIN]}><SuperAdminPage /></PrivateRoute>} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </React.Suspense>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <FeedbackProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </FeedbackProvider>
    </AuthProvider>
  );
};

export default App;