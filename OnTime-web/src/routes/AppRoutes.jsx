// src/routes/AppRoutes.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import DashboardPage from '../pages/dashboard/DashboardPage';
import UserManagementPage from '../pages/users/UserManagementPage';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
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
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;