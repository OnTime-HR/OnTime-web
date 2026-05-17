import React from 'react';
import { LayoutGrid, Users, MapPin, FileCheck, MessageSquare, Settings, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: <LayoutGrid size={22} />, label: 'Dashboard', path: '/' },
    { icon: <Users size={22} />, label: 'User and Role Management', path: '/users' },
    { icon: <MapPin size={22} />, label: 'Geofencing and Operations', path: '/geofencing' },
    { icon: <FileCheck size={22} />, label: 'Approvals and Reports', path: '/reports' },
    { icon: <MessageSquare size={22} />, label: 'News & Events', path: '/news' },
    { icon: <Settings size={22} />, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="w-72 h-screen bg-[#F0F2F5] border-r border-gray-200 flex flex-col p-5 fixed left-0 top-0">
      {/* Brand Header */}
      <div className="flex items-center gap-4 px-2 mb-12">
        <div className="w-12 h-12 bg-[#E8D5C4] rounded-full flex-shrink-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-800 leading-tight">Admin Panel</h2>
          <p className="text-xs text-gray-500 font-medium">Management Console</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <div
              key={index}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-all ${
                isActive 
                  ? 'bg-[#F9E8D2] text-[#F9A825] font-bold shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-200 font-medium'
              }`}
            >
              <span className={isActive ? 'text-[#F9A825]' : 'text-gray-600'}>
                {item.icon}
              </span>
              <span className="text-[14px]">{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* Log Out */}
      <div className="flex items-center gap-4 px-4 py-6 text-red-500 cursor-pointer border-t border-gray-300 hover:bg-red-50 transition-colors mt-auto">
        <LogOut size={22} />
        <span className="text-[14px] font-bold">Log Out</span>
      </div>
    </div>
  );
};

export default Sidebar;