// src/routes/AppRoutes.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import DashboardPage from '../pages/dashboard/DashboardPage';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          } 
        />
        {/* Add more routes here as you build them */}
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;