import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export function RequireAuth() {
  const { user, ready } = useSelector((state) => state.auth);
  if (!ready) return <div className="full-page-loading"><span className="loading-dot" />Loading your workspace</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RequireRole({ roles }) {
  const user = useSelector((state) => state.auth.user);
  return roles.includes(user?.role) ? <Outlet /> : <Navigate to="/app" replace />;
}
