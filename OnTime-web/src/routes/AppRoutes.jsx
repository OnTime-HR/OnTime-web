// src/routes/AppRoutes.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import DashboardPage from '../pages/dashboard/DashboardPage';
import UserManagementPage from '../pages/users/UserManagementPage';
import GeofencingPage from '../pages/dashboard/GeofencingPage';
import ApprovalsPage from '../pages/users/ApprovalsPage';
import NewsEventsPage from '../pages/dashboard/NewsEventsPage';
import SettingsPage from '../pages/dashboard/SettingsPage';

// IMPORTANT: Cleaned up MfaVerifyPage import line to fix compilation crash
import LoginPage from '../pages/dashboard/LoginPage';
import ProtectedRoute from './ProtectedRoute';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ACCOUNT PORTAL GATEWAYS */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* SECURE PROTECTED ADMINISTRATIVE CONSOLE HUBS */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout title="Dashboard" subtitle="Real-time operational metrics and announcements">
                <DashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/users" 
          element={
            <ProtectedRoute>
              <DashboardLayout title="User and Role Management" subtitle="Manage access, Roles, and invitations">
                <UserManagementPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/geofencing-and-operations" 
          element={
            <ProtectedRoute>
              <DashboardLayout 
                title="Geofencing and Operations" 
                subtitle="Manage operational zones and assign shift templates to staff."
              >
                <GeofencingPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <DashboardLayout title="Approvals and Reports" subtitle="Manage Pending Request and Generate Reports">
                <ApprovalsPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/news" 
          element={
            <ProtectedRoute>
              <DashboardLayout title="News & Events" subtitle="Manage institutional notifications and company announcements">
                <NewsEventsPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <DashboardLayout title="Settings" subtitle="Configure system configurations, geofencing guidelines, and global alerts">
                <SettingsPage />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        {/* FALLBACK CATCH-ALL: Bounces unauthorized or unknown paths straight back to the login wall */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;