// src/routes/AppRoutes.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import DashboardPage from '../pages/dashboard/DashboardPage';
import UserManagementPage from '../pages/users/UserManagementPage';
import GeofencingPage from '../pages/dashboard/GeofencingPage';
import ApprovalsPage from '../pages/users/ApprovalsPage';
import NewsEventsPage from '../pages/dashboard/NewsEventsPage';
import SettingsPage from '../pages/dashboard/SettingsPage';
import LoginPage from '../pages/dashboard/LoginPage';
import MfaVerifyPage from '../pages/dashboard/MfaVerifyPage';
import ProtectedRoute from './ProtectedRoute';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-mfa" element={<MfaVerifyPage />} />
        <Route 
          path="/dashboard" 
          element={
            <DashboardLayout title="Dashboard" subtitle="Real-time operational metrics and announcements">
              <DashboardPage />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/users" 
          element={
            <DashboardLayout title="User and Role Management" subtitle="Manage access, Roles, and invitations">
              <UserManagementPage />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/geofencing-and-operations" 
          element={
            <DashboardLayout 
              title="Geofencing and Operations" 
              subtitle="Manage operational zones and assign shift templates to staff."
            >
              <GeofencingPage />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <DashboardLayout title="Approvals and Reports" subtitle="Manage Pending Request and Generate Reports">
              <ApprovalsPage />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/news" 
          element={
            <DashboardLayout title="News & Events" subtitle="Manage institutional notifications and company announcements">
              <NewsEventsPage />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <DashboardLayout title="Settings" subtitle="Configure system configurations, geofencing guidelines, and global alerts">
              <SettingsPage />
            </DashboardLayout>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;