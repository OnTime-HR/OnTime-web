// src/pages/dashboard/GeofencingPage.jsx
import React, { useState, useEffect } from 'react';
import { Layers, Compass, MapPin, Plus, Calendar } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, addDoc, serverTimestamp } from 'firebase/firestore';

const GeofencingPage = () => {
  // State variables matching the backend requirements
  const [shiftName, setShiftName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [activeShifts, setActiveShifts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Live Stream connection to your existing Firestore collections
  useEffect(() => {
    const q = query(collection(db, "schedules"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shiftsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActiveShifts(shiftsData);
    }, (error) => {
      console.error("Firestore live stream error: ", error);
    });

    return () => unsubscribe();
  }, []);

  // Handler to create custom templates inside the right sidebar
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!shiftName.trim()) return;
    setLoading(true);

    try {
      await addDoc(collection(db, "schedules"), {
        name: shiftName,
        startTime: startTime,
        endTime: endTime,
        status: 'Active',
        createdAt: serverTimestamp()
      });
      setShiftName('');
      alert("Shift template saved successfully!");
    } catch (error) {
      console.error("Error creating shift template:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 pt-28">
      <div className="grid grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Map View Container */}
        <div className="col-span-8 flex flex-col">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[550px]">
            {/* Map Header bar */}
            <div className="bg-[#FFF4E5]/50 px-6 py-4 border-b border-orange-50 flex justify-between items-center">
              <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">
                <MapPin className="text-[#F9A825]" size={18} />
                Active Zones Map
              </div>
              <div className="flex items-center gap-4 text-gray-500">
                <Layers size={18} className="cursor-pointer hover:text-[#F9A825] transition-colors" />
                <Compass size={18} className="cursor-pointer hover:text-[#F9A825] transition-colors" />
              </div>
            </div>

            {/* Map Plot Area */}
            <div className="flex-1 bg-gray-50 p-6 relative">
              {/* HQ Floating Badge Card component */}
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-orange-100/70 shadow-md max-w-xs">
                <div className="flex justify-between items-start mb-1 gap-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Zone</span>
                  <span className="bg-green-50 text-green-600 text-[10px] px-2 py-0.5 rounded-full font-semibold">Active</span>
                </div>
                <h4 className="font-bold text-[#F9A825] text-base mb-2">Main HQ Campus</h4>
                <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                  <span className="flex items-center gap-1">📍 500m Radius</span>
                  <span className="flex items-center gap-1">👥 42 On-site</span>
                </div>
              </div>

              {/* Floating Map Utility Edit Button */}
              <button className="absolute bottom-6 right-6 bg-[#F9A825] text-white p-3.5 rounded-full shadow-lg hover:bg-orange-500 transition-all transform hover:scale-105">
                <MapPin size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Operations Sidebar (Shift Planner) */}
        <div className="col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full justify-between">
            <div>
              {/* Planner Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 text-base">Shift Planner</h3>
                <button className="text-[#F9A825] hover:text-orange-600 text-xs font-bold flex items-center gap-1 transition-colors">
                  <Calendar size={14} /> View Calendar
                </button>
              </div>

              {/* Quick Template Design Container */}
              <form onSubmit={handleSaveTemplate} className="bg-[#FFF4E5]/30 border border-orange-100/50 rounded-xl p-4 space-y-4 mb-6">
                <span className="text-[10px] font-bold text-[#F9A825] block uppercase tracking-wider">Quick Create Template</span>
                <input 
                  type="text"
                  placeholder="Shift Name (e.g. Morning Rush)"
                  className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2.5 text-xs outline-none focus:border-[#F9A825] text-gray-700"
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="time"
                    className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#F9A825] text-gray-700"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  <input 
                    type="time"
                    className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#F9A825] text-gray-700"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#F9A825] text-white text-xs font-bold py-2.5 rounded-lg shadow-sm hover:bg-orange-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Template'}
                </button>
              </form>

              {/* Current Active List Feed */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-800">Today's Shifts</h4>
                  <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {activeShifts.length} Active
                  </span>
                </div>

                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {/* Dynamic Shift Loop mapping */}
                  {activeShifts.map((shift) => (
                    <div key={shift.id} className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                      <div className="flex gap-3 items-center">
                        <div className="w-1 h-8 bg-blue-600 rounded-full" />
                        <div>
                          <h5 className="text-xs font-bold text-gray-800">{shift.name}</h5>
                          <p className="text-[10px] text-gray-400 font-medium">{shift.startTime} - {shift.endTime}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {activeShifts.length === 0 && (
                    <p className="text-[11px] text-gray-400 text-center py-4">No custom templates defined</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Add Trigger Button Action */}
            <button className="w-full mt-6 border-2 border-dashed border-gray-200 rounded-xl py-3 text-xs font-bold text-gray-500 hover:border-[#F9A825] hover:text-[#F9A825] transition-all flex items-center justify-center gap-2 group">
              <Plus size={16} className="text-gray-400 group-hover:text-[#F9A825]" /> Assign New Shift
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GeofencingPage;