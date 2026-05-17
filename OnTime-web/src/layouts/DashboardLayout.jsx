// src/layouts/DashboardLayout.jsx
import React from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import Topbar from '../components/dashboard/Topbar';

const DashboardLayout = ({ children, title, subtitle }) => {
  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* Sidebar is fixed at w-72 */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col ml-72">
        <Topbar title={title} subtitle={subtitle} />
        
        {/* pt-24 (96px) ensures content starts below the fixed Topbar */}
        <main className="pt-24 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;