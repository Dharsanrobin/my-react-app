import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute() {
  const isAuth = localStorage.getItem("isAuth") === "true";
  const location = useLocation();

  // ❗ User not logged in → must redirect to /auth
  if (!isAuth) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
