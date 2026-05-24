import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthGuard from '../components/AuthGuard/AuthGuard';
import AppLayout from '../components/AppLayout/AppLayout';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import PlagiarismPage from '../pages/plagiarism/PlagiarismPage';
import ResumeListPage from '../pages/resume/ResumeListPage';
import ResumeEditorPage from '../pages/resume/ResumeEditorPage';
import NovelListPage from '../pages/novel/NovelListPage';
import NovelWorkspace from '../pages/novel/NovelWorkspace';
import ProfilePage from '../pages/profile/ProfilePage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'plagiarism', element: <PlagiarismPage /> },
          { path: 'resumes', element: <ResumeListPage /> },
          { path: 'resumes/:id/edit', element: <ResumeEditorPage /> },
          { path: 'novels', element: <NovelListPage /> },
          { path: 'novels/:id', element: <NovelWorkspace /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
]);
