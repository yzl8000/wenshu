import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';

// Public pages — eagerly loaded for fast initial render
import LandingPage from '../pages/landing/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

// App pages — lazy loaded (reduces initial bundle by ~2MB)
const AuthGuard = lazy(() => import('../components/AuthGuard/AuthGuard'));
const AppLayout = lazy(() => import('../components/AppLayout/AppLayout'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const PlagiarismPage = lazy(() => import('../pages/plagiarism/PlagiarismPage'));
const ResumeListPage = lazy(() => import('../pages/resume/ResumeListPage'));
const ResumeEditorPage = lazy(() => import('../pages/resume/ResumeEditorPage'));
const NovelListPage = lazy(() => import('../pages/novel/NovelListPage'));
const NovelWorkspace = lazy(() => import('../pages/novel/NovelWorkspace'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const WalletPage = lazy(() => import('../pages/wallet/WalletPage'));
const AdminPage = lazy(() => import('../pages/admin/AdminPage'));

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Spin size="large" style={{ display: 'block', margin: '100px auto' }} />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  {
    element: <Lazy><AuthGuard /></Lazy>,
    children: [
      {
        path: '/app',
        element: <Lazy><AppLayout /></Lazy>,
        children: [
          { index: true, element: <Navigate to="/app/dashboard" replace /> },
          { path: 'dashboard', element: <Lazy><DashboardPage /></Lazy> },
          { path: 'plagiarism', element: <Lazy><PlagiarismPage /></Lazy> },
          { path: 'resumes', element: <Lazy><ResumeListPage /></Lazy> },
          { path: 'resumes/:id/edit', element: <Lazy><ResumeEditorPage /></Lazy> },
          { path: 'novels', element: <Lazy><NovelListPage /></Lazy> },
          { path: 'novels/:id', element: <Lazy><NovelWorkspace /></Lazy> },
          { path: 'profile', element: <Lazy><ProfilePage /></Lazy> },
          { path: 'wallet', element: <Lazy><WalletPage /></Lazy> },
          { path: 'admin', element: <Lazy><AdminPage /></Lazy> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
