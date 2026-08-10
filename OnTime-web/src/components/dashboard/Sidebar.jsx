// src/components/dashboard/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { LayoutGrid, Users, MapPin, FileCheck, MessageSquare, Settings, LogOut, ShieldAlert, Trash2, Calendar } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; // UPDATED: Using onSnapshot for live data

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [adminData, setAdminData] = useState({ name: 'Admin', photoUrl: '' });

  // UPDATED: Real-time listener on the admin collection
  useEffect(() => {
    // We wrap this in onAuthStateChanged to ensure we have the auth user before fetching
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const adminDocRef = doc(db, "admin", user.uid);
        
        // Listen to the document in real-time
        const unsubscribeSnapshot = onSnapshot(adminDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setAdminData({
              name: docSnap.data().name || 'Admin',
              photoUrl: docSnap.data().photoUrl || '' 
            });
          }
        });

        // Cleanup the snapshot listener when component unmounts or user changes
        return () => unsubscribeSnapshot();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const menuItems = [
    { icon: <LayoutGrid size={22} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Users size={22} />, label: 'User & Role Management', path: '/users' },
    { icon: <MapPin size={22} />, label: 'Geofencing & Operations', path: '/geofencing-and-operations' }, 
    { icon: <FileCheck size={22} />, label: 'Approvals & Reports', path: '/reports' },
    { icon: <Calendar size={22} />, label: 'Shifts & Attendence', path: '/shifts' },
    { icon: <MessageSquare size={22} />, label: 'News & Events', path: '/news' },
    { icon: <Settings size={22} />, label: 'Settings', path: '/settings' },
    { icon: <Trash2 size={22} />, label: 'Trash Bin', path: '/trash' }, 
  ];

  const handleAdminLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      sessionStorage.clear(); 
      localStorage.clear(); 
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("An error occurred during session termination: ", error);
    } finally {
      setLoading(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <>
      <div className="w-72 h-screen bg-[#F0F2F5] border-r border-gray-200 flex flex-col p-5 fixed left-0 top-0 z-[99999]">
        
        {/* Brand Header with Live Admin Data */}
        <div className="flex items-center gap-4 px-2 mb-12">
          {adminData.photoUrl ? (
            <img 
              src={adminData.photoUrl} 
              alt="Admin" 
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 bg-[#E8D5C4] rounded-full flex-shrink-0 flex items-center justify-center font-bold text-gray-700">
              {adminData.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-base font-bold text-gray-800 leading-tight">Admin Panel</h2>
            <p className="text-xs text-gray-500 font-medium">{adminData.name}</p>
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

        {/* Log Out Button */}
        <div 
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-4 px-4 py-6 text-red-500 cursor-pointer border-t border-gray-300 hover:bg-red-50 transition-colors mt-auto rounded-xl group"
        >
          <LogOut size={22} className="transition-transform group-hover:-translate-x-0.5" />
          <span className="text-[14px] font-bold">Log Out</span>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 pointer-events-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 text-center shadow-2xl border border-gray-50 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-amber-50 text-[#F9A825] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={24} />
            </div>
            <h3 className="text-base font-black text-gray-800 tracking-tight">Terminate Console Session?</h3>
            <p className="text-xs text-gray-400 font-medium mt-2 leading-relaxed opacity-95">
              Are you sure you want to log out of the administrative management panel?
            </p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowLogoutConfirm(false)}
                className="bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold py-3 rounded-xl border border-gray-100 outline-none transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleAdminLogout}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-3 rounded-xl border-0 outline-none transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Clearing Session...' : 'Log Out Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;