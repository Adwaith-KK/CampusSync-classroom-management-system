import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Common Pages (accessible to multiple roles)
import ClassroomAvailabilityPage from './pages/common/ClassroomAvailabilityPage';
import FacilitiesPage from './pages/common/FacilitiesPage';

// Role-Specific Dashboards
import StudentDashboard from './pages/student/StudentDashboard';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import HodDashboard from './pages/hod/HodDashboard';
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';

// Shared pages
import TimetablePage from './pages/shared/TimetablePage';
import MyBookingsPage from './pages/shared/MyBookingsPage';
import NotificationsPage from './pages/shared/NotificationsPage';
import ProfilePage from './pages/shared/ProfilePage';

// Management pages (HOD + Coordinator only)
import ManageBookingsPage from './pages/management/ManageBookingsPage';
import ManageClassroomsPage from './pages/management/ManageClassroomsPage';
import ManageFacilitiesPage from './pages/management/ManageFacilitiesPage';
import ManageUsersPage from './pages/management/ManageUsersPage';
import ManageTimetablePage from './pages/management/ManageTimetablePage';
import AnalyticsPage from './pages/management/AnalyticsPage';
import AuditLogsPage from './pages/management/AuditLogsPage';

// Utility Pages
import UnauthorizedPage from './pages/utility/UnauthorizedPage';
import NotFoundPage from './pages/utility/NotFoundPage';

// Layout
import DashboardLayout from './layouts/DashboardLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// -----------------------------------------------------------------------
// ProtectedRoute: ensures user is authenticated and has allowed role(s)
// -----------------------------------------------------------------------
function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner message="Verifying session..." />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

// -----------------------------------------------------------------------
// RoleDashboardRedirect: redirect to the correct dashboard based on role
// -----------------------------------------------------------------------
function RoleDashboardRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner message="Loading..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  switch (user?.role) {
    case 'student':     return <Navigate to="/student/dashboard" replace />;
    case 'faculty':     return <Navigate to="/faculty/dashboard" replace />;
    case 'hod':         return <Navigate to="/hod/dashboard" replace />;
    case 'coordinator': return <Navigate to="/coordinator/dashboard" replace />;
    default:            return <Navigate to="/login" replace />;
  }
}

// -----------------------------------------------------------------------
// PublicOnlyRoute: redirect authenticated users away from login/register
// -----------------------------------------------------------------------
function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner message="Loading..." />;
  if (isAuthenticated) return <RoleDashboardRedirect />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      {/* Root → redirect to role dashboard */}
      <Route path="/" element={<RoleDashboardRedirect />} />

      {/* Public only (unauthenticated) */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* --- STUDENT ROUTES --- */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/classrooms" element={<ClassroomAvailabilityPage />} />
          <Route path="/student/facilities" element={<FacilitiesPage />} />
          <Route path="/student/timetable"  element={<TimetablePage />} />
          <Route path="/student/notifications" element={<NotificationsPage />} />
          <Route path="/student/profile"    element={<ProfilePage />} />
        </Route>
      </Route>

      {/* --- FACULTY ROUTES --- */}
      <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/faculty/dashboard"     element={<FacultyDashboard />} />
          <Route path="/faculty/classrooms"    element={<ClassroomAvailabilityPage />} />
          <Route path="/faculty/facilities"    element={<FacilitiesPage />} />
          <Route path="/faculty/timetable"     element={<TimetablePage />} />
          <Route path="/faculty/bookings"      element={<MyBookingsPage />} />
          <Route path="/faculty/notifications" element={<NotificationsPage />} />
          <Route path="/faculty/profile"       element={<ProfilePage />} />
        </Route>
      </Route>

      {/* --- HOD ROUTES --- */}
      <Route element={<ProtectedRoute allowedRoles={['hod']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/hod/dashboard"         element={<HodDashboard />} />
          <Route path="/hod/classrooms"        element={<ClassroomAvailabilityPage />} />
          <Route path="/hod/facilities"        element={<FacilitiesPage />} />
          <Route path="/hod/timetable"         element={<TimetablePage />} />
          <Route path="/hod/bookings"          element={<MyBookingsPage />} />
          <Route path="/hod/manage/bookings"   element={<ManageBookingsPage />} />
          <Route path="/hod/manage/classrooms" element={<ManageClassroomsPage />} />
          <Route path="/hod/manage/timetable"  element={<ManageTimetablePage />} />
          <Route path="/hod/manage/users"      element={<ManageUsersPage />} />
          <Route path="/hod/analytics"         element={<AnalyticsPage />} />
          <Route path="/hod/audit-logs"        element={<AuditLogsPage />} />
          <Route path="/hod/notifications"     element={<NotificationsPage />} />
          <Route path="/hod/profile"           element={<ProfilePage />} />
        </Route>
      </Route>

      {/* --- COORDINATOR ROUTES --- */}
      <Route element={<ProtectedRoute allowedRoles={['coordinator']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/coordinator/dashboard"         element={<CoordinatorDashboard />} />
          <Route path="/coordinator/classrooms"        element={<ClassroomAvailabilityPage />} />
          <Route path="/coordinator/facilities"        element={<FacilitiesPage />} />
          <Route path="/coordinator/timetable"         element={<TimetablePage />} />
          <Route path="/coordinator/bookings"          element={<MyBookingsPage />} />
          <Route path="/coordinator/manage/bookings"   element={<ManageBookingsPage />} />
          <Route path="/coordinator/manage/classrooms" element={<ManageClassroomsPage />} />
          <Route path="/coordinator/manage/facilities" element={<ManageFacilitiesPage />} />
          <Route path="/coordinator/manage/timetable"  element={<ManageTimetablePage />} />
          <Route path="/coordinator/manage/users"      element={<ManageUsersPage />} />
          <Route path="/coordinator/analytics"         element={<AnalyticsPage />} />
          <Route path="/coordinator/audit-logs"        element={<AuditLogsPage />} />
          <Route path="/coordinator/notifications"     element={<NotificationsPage />} />
          <Route path="/coordinator/profile"           element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Shared convenience aliases (redirect-safe fallbacks) */}
      <Route path="/classrooms"    element={<ProtectedRoute allowedRoles={['student','faculty','hod','coordinator']} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<ClassroomAvailabilityPage />} />
        </Route>
      </Route>
      <Route path="/facilities" element={<ProtectedRoute allowedRoles={['student','faculty','hod','coordinator']} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<FacilitiesPage />} />
        </Route>
      </Route>
      <Route path="/timetable" element={<ProtectedRoute allowedRoles={['student','faculty','hod','coordinator']} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<TimetablePage />} />
        </Route>
      </Route>
      <Route path="/bookings" element={<ProtectedRoute allowedRoles={['faculty','hod','coordinator']} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<MyBookingsPage />} />
        </Route>
      </Route>
      <Route path="/notifications" element={<ProtectedRoute allowedRoles={['student','faculty','hod','coordinator']} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<NotificationsPage />} />
        </Route>
      </Route>
      <Route path="/profile" element={<ProtectedRoute allowedRoles={['student','faculty','hod','coordinator']} />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Utility */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*"             element={<NotFoundPage />} />
    </Routes>
  );
}
