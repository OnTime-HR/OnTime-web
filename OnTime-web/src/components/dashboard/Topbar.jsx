// src/components/dashboard/Topbar.jsx
import React from 'react';
import { Search, Bell } from 'lucide-react';

const Topbar = ({ title = "Dashboard", subtitle = "Real-time operational metrics and announcements" }) => {
  return (
    // 'fixed' keeps it at the top, 'left-72' matches your sidebar width, 'z-10' keeps it on top
    <div className="fixed top-0 left-72 right-0 h-24 bg-[#F8F9FA]/90 backdrop-blur-md z-10 px-10 flex items-center justify-between border-b border-gray-100">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
        <p className="text-gray-500 text-sm">{subtitle}</p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-[#F9A825] text-white placeholder-orange-100 rounded-full pl-6 pr-12 py-2.5 w-80 outline-none shadow-sm"
          />
          <Search className="absolute right-5 top-3 text-white" size={18} />
        </div>

        <div className="p-2.5 bg-[#FFF4E5] rounded-full text-[#F9A825] relative cursor-pointer border border-orange-50">
          <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
          <Bell size={22} />
        </div>
      </div>
    </div>
  );
};

export default Topbar;