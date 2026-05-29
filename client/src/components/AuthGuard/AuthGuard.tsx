import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { Spin } from 'antd';

export default function AuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser().finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (checking && isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
