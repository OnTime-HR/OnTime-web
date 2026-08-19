// src/components/dashboard/Topbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Activity, FileText, Clock, AlertTriangle, CheckCircle2, X, AlertOctagon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';

const Topbar = ({ title = "Dashboard", subtitle = "Real-time operational metrics and announcements" }) => {
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set()); // Tracks clicked notifications
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Emergency Modal State
  const [emergencyModalData, setEmergencyModalData] = useState(null);
  const [isResolving, setIsResolving] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Helper to format timestamps gracefully for the dropdown
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  useEffect(() => {
    let leaves = [];
    let claims = [];
    let alerts = [];

    const updateNotifications = () => {
      const combined = [...leaves, ...claims, ...alerts]
        .sort((a, b) => b.rawTime - a.rawTime)
        .slice(0, 15); 
      setNotifications(combined);
    };

    // 1. Listen for Pending Leave Requests
    const qLeaves = query(collection(db, 'leave_requests'), where('status', '==', 'Pending'));
    const unsubLeaves = onSnapshot(qLeaves, (snapshot) => {
      leaves = snapshot.docs.map(doc => {
        const data = doc.data();
        const time = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
        return {
          id: doc.id,
          type: 'leave',
          title: 'Leave Request',
          message: `${data.employeeName || 'An employee'} requested time off.`,
          rawTime: time,
          timeString: formatTimeAgo(time),
          path: '/reports'
        };
      });
      updateNotifications();
    });

    // 2. Listen for Pending Medical Claims
    const qClaims = query(collection(db, 'medical_claims'), where('status', '==', 'Pending'));
    const unsubClaims = onSnapshot(qClaims, (snapshot) => {
      claims = snapshot.docs.map(doc => {
        const data = doc.data();
        const time = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
        return {
          id: doc.id,
          type: 'claim',
          title: 'Medical Claim',
          message: `${data.employeeName || 'An employee'} submitted a new medical claim.`,
          rawTime: time,
          timeString: formatTimeAgo(time),
          path: '/reports'
        };
      });
      updateNotifications();
    });

    // 3. Listen for Active Emergency Alerts
    const qAlerts = query(collection(db, 'emergency_alerts'), where('status', '==', 'active'));
    const unsubAlerts = onSnapshot(qAlerts, (snapshot) => {
      alerts = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Handle Firebase String timestamps (e.g., "15 June 2026 at 21:55:01 UTC+5:30")
        let rawTime = Date.now();
        let displayTime = 'Time not recorded';

        if (typeof data.timestamp === 'string') {
          // Attempt to parse string for sorting, fallback to now if invalid
          rawTime = Date.parse(data.timestamp.replace(' at ', ' ')) || Date.now();
          displayTime = data.timestamp;
        } else if (data.timestamp?.toMillis) {
          rawTime = data.timestamp.toMillis();
          displayTime = new Date(rawTime).toLocaleString();
        }

        return {
          id: doc.id,
          type: 'emergency',
          title: 'SOS EMERGENCY',
          message: `${data.userName || 'Someone'} triggered an SOS!`,
          userName: data.userName || 'Unknown User',
          reason: data.reason || 'No reason provided',
          exactTime: displayTime,
          rawTime: rawTime,
          timeString: formatTimeAgo(rawTime),
          path: null // Emergencies open a modal instead of routing
        };
      });
      updateNotifications();
    });

    return () => {
      unsubLeaves();
      unsubClaims();
      unsubAlerts();
    };
  }, []);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle individual notification clicks
  const handleNotificationClick = (notif) => {
    setIsDropdownOpen(false);
    
    // 1. Mark as read locally to decrease the badge count
    setReadIds(prev => new Set(prev).add(notif.id));

    // 2. Route based on type
    if (notif.type === 'emergency') {
      setEmergencyModalData(notif);
    } else if (notif.path) {
      navigate(notif.path);
    }
  };

  // Resolve Emergency in Database
  const handleResolveEmergency = async () => {
    if (!emergencyModalData) return;
    setIsResolving(true);
    try {
      await updateDoc(doc(db, 'emergency_alerts', emergencyModalData.id), {
        status: 'resolved'
      });
      setEmergencyModalData(null);
    } catch (error) {
      console.error("Error resolving emergency:", error);
    } finally {
      setIsResolving(false);
    }
  };

  // Calculate unread count by filtering out IDs present in the `readIds` set
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const getIconForType = (type) => {
    switch (type) {
      case 'leave': return <Clock size={16} className="text-blue-500" />;
      case 'claim': return <FileText size={16} className="text-emerald-500" />;
      case 'emergency': return <AlertTriangle size={16} className="text-rose-500" />;
      default: return <Activity size={16} className="text-amber-500" />;
    }
  };

  return (
    <>
      <div className="fixed top-0 left-72 right-0 h-24 bg-[#F8F9FA]/90 backdrop-blur-md z-[4000] px-10 flex items-center justify-between border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
          <p className="text-gray-500 text-sm">{subtitle}</p>
        </div>
        
        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
          
          {/* BELL ICON BUTTON */}
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`p-2.5 rounded-full relative cursor-pointer border transition-colors ${
              isDropdownOpen || unreadCount > 0 
                ? 'bg-[#FFF4E5] text-[#F9A825] border-orange-100 hover:bg-amber-100' 
                : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-600'
            }`}
          >
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
            <Bell size={22} />
          </div>

          {/* NOTIFICATION DROPDOWN MENU */}
          {isDropdownOpen && (
            <div className="absolute top-14 right-0 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-800">System Alerts</h3>
                <span className="text-[10px] font-bold bg-amber-100 text-[#F9A825] px-2 py-0.5 rounded-md">
                  {unreadCount} Unread
                </span>
              </div>
              
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-10 flex flex-col items-center justify-center text-center">
                    <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
                    <p className="text-sm font-bold text-gray-700">All Caught Up!</p>
                    <p className="text-xs text-gray-400 mt-1">There are no pending requests.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map((notif) => {
                      const isRead = readIds.has(notif.id);
                      return (
                        <div 
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-4 cursor-pointer transition-colors flex gap-3 group ${
                            isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-50/60'
                          }`}
                        >
                          <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            notif.type === 'emergency' ? 'bg-rose-100 text-rose-600 animate-pulse' :
                            notif.type === 'leave' ? 'bg-blue-100' : 
                            'bg-emerald-100'
                          }`}>
                            {getIconForType(notif.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-0.5">
                              <h4 className={`text-xs font-bold transition-colors group-hover:text-[#F9A825] ${
                                notif.type === 'emergency' ? 'text-rose-600' : 'text-gray-900'
                              }`}>
                                {notif.title}
                              </h4>
                              <span className="text-[10px] font-semibold text-gray-400">{notif.timeString}</span>
                            </div>
                            <p className={`text-xs leading-relaxed line-clamp-2 ${isRead ? 'text-gray-400' : 'text-gray-600'}`}>
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/reports');
                  }}
                  className="p-3 border-t border-gray-100 text-center text-xs font-bold text-[#F9A825] hover:bg-amber-50 cursor-pointer transition-colors"
                >
                  Review All in Approvals Center
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* HIGH PRIORITY EMERGENCY MODAL                             */}
      {/* ========================================================= */}
      {emergencyModalData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-rose-600 p-6 text-center relative">
              <button 
                onClick={() => setEmergencyModalData(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors cursor-pointer outline-none"
              >
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 text-white">
                <AlertOctagon size={32} />
              </div>
              <h2 className="text-xl font-black text-white tracking-wide">SOS EMERGENCY</h2>
              <p className="text-rose-100 text-sm font-medium mt-1">Immediate attention required.</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-1">Sender</p>
                <p className="text-sm font-bold text-gray-900">{emergencyModalData.userName}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Time Triggered</p>
                <p className="text-sm font-bold text-gray-900">{emergencyModalData.exactTime}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Reason / Message</p>
                <p className="text-sm font-bold text-gray-900 break-words">{emergencyModalData.reason}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 pt-2 grid grid-cols-2 gap-3">
              <button 
                onClick={() => setEmergencyModalData(null)}
                className="py-3 px-4 rounded-xl font-bold text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Keep Active
              </button>
              <button 
                onClick={handleResolveEmergency}
                disabled={isResolving}
                className="py-3 px-4 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isResolving ? 'Resolving...' : 'Acknowledge & Resolve'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;