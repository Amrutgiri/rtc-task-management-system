import { Navigate } from "react-router-dom";

export default function PublicGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");

  if (token) {
    // User already logged in → redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
