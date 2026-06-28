import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import AdminUsers from "./pages/AdminUsers";
import AdminLogs from "./pages/AdminLogs";
import MainLayout from "./components/MainLayout";
import UserLogs from "./pages/UserLogs";
import ReportList from "./components/ReportList";
import { useReports } from "./hooks/useReports";

function App() {
  const { user, loading } = useAuth();
  const { reports } = useReports();

  // While we check /auth/me on load, don't flash content
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">Loading…</div>
    );

  return (
    <Routes>
      {/* PUBLIC */}
      {!user && (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}

      {/* PROTECTED */}
      {user && (
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="view" element={<ReportList data={reports} />} />

          {user.role === "admin" && (
            <>
              <Route path="admin/users" element={<AdminUsers />} />
              <Route path="admin/logs" element={<AdminLogs />} />
              <Route path="users/:userId/logs" element={<UserLogs />} />
            </>
          )}

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      )}
    </Routes>
  );
}

export default App;
