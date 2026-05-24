// src/pages/dashboard/GeofencingPage.jsx
import React, { useState, useEffect } from 'react';
import { Layers, Compass, MapPin, Plus, Calendar, Users } from 'lucide-react';
import { streamOfficeZones, updateOfficeZone, streamTodayCheckedInStaff } from '../../services/geofenceService';
import { saveShiftTemplate, streamShiftsByDate } from '../../services/shiftService';

const GeofencingPage = () => {
  const companyCode = "COM100";
  
  // Office boundary tracking states
  const [offices, setOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState('');
  const [isEditingZone, setIsEditingZone] = useState(false);
  
  // Form input fields states
  const [formName, setFormName] = useState('');
  const [formRadius, setFormRadius] = useState(50);
  const [formLat, setFormLat] = useState(6.7154669);
  const [formLon, setFormLon] = useState(80.7888601);

  // Dynamic Shift lists states
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftName, setShiftName] = useState('');
  const [activeShifts, setActiveShifts] = useState([]);
  const [shiftLoading, setShiftLoading] = useState(false);

  // Live Check-in tracking state variables
  const [onSiteEmployees, setOnSiteEmployees] = useState([]);

  // 1. Establish the live stream listener to the active offices collection
  useEffect(() => {
    const unsubscribe = streamOfficeZones((officeList) => {
      setOffices(officeList);
      if (officeList.length > 0 && !selectedOfficeId) {
        setSelectedOfficeId(officeList[0].id);
      }
    });
    return () => unsubscribe();
  }, [selectedOfficeId]);

  // 2. Establish live stream listener for Schedules Subcollections
  useEffect(() => {
    const unsubscribeShifts = streamShiftsByDate(companyCode, shiftDate, (shiftsData) => {
      setActiveShifts(shiftsData);
    });
    return () => unsubscribeShifts();
  }, [shiftDate]);

  // 3. Reactive effect hook tracking live check-in logs matching the active date selection box
  useEffect(() => {
    const unsubscribeOnSite = streamTodayCheckedInStaff(shiftDate, (checkedInStaff) => {
      setOnSiteEmployees(checkedInStaff);
    });
    return () => unsubscribeOnSite();
  }, [shiftDate]);

  // Find the currently active selected office object metrics
  const activeOffice = offices.find(o => o.id === selectedOfficeId) || {
    name: 'Loading...', radius: 50, latitude: 6.7154, longitude: 80.7888
  };

  const startEditing = () => {
    setFormName(activeOffice.name);
    setFormRadius(activeOffice.radius);
    setFormLat(activeOffice.latitude);
    setFormLon(activeOffice.longitude);
    setIsEditingZone(true);
  };

  const handleUpdateOffice = async (e) => {
    e.preventDefault();
    try {
      await updateOfficeZone(selectedOfficeId, {
        name: formName,
        radius: formRadius,
        latitude: formLat,
        longitude: formLon
      });
      setIsEditingZone(false);
      alert("Office boundary data updated successfully!");
    } catch (error) {
      alert("Failed to write coordinates: " + error.message);
    }
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    if (!shiftName.trim()) return;
    setShiftLoading(true);

    try {
      await saveShiftTemplate(companyCode, shiftDate, shiftName);
      setShiftName('');
      alert(`Shift assigned successfully for ${shiftDate}!`);
    } catch (error) {
      alert("Failed to save shift entry map data: " + error.message);
    } finally {
      setShiftLoading(false);
    }
  };

  return (
    <div className="p-10">
      <div className="grid grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Map & Configuration Panel */}
        <div className="col-span-8 flex flex-col space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[420px] relative">
            
            <div className="bg-[#FFF4E5]/50 px-6 py-4 border-b border-orange-50 flex justify-between items-center">
              <div className="flex items-center gap-3 font-bold text-gray-800 text-sm">
                <MapPin className="text-[#F9A825]" size={18} />
                <span>Zone:</span>
                <select 
                  className="bg-white border border-orange-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-[#F9A825]"
                  value={selectedOfficeId}
                  onChange={(e) => setSelectedOfficeId(e.target.value)}
                >
                  {offices.map(off => (
                    <option key={off.id} value={off.id}>{off.id} ({off.name})</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4 text-gray-500">
                <Layers size={18} />
                <Compass size={18} />
              </div>
            </div>

            <div className="flex-1 bg-gray-50 p-6 relative flex flex-col justify-between">
              {!isEditingZone ? (
                <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl border border-orange-100/70 shadow-md max-w-xs z-10">
                  <div className="flex justify-between items-start mb-1 gap-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ID: {selectedOfficeId}</span>
                    {/* FIXED COUNT BADGE: Dynamically displays active count unique to this selected branch ID */}
                    <span className="bg-green-50 text-green-600 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                       {onSiteEmployees.filter(emp => emp.assignedOfficeId === selectedOfficeId).length} On-site
                    </span>
                  </div>
                  <h4 className="font-bold text-[#F9A825] text-base mb-2">{activeOffice.name} Campus</h4>
                  <div className="space-y-1 text-xs text-gray-500 font-medium">
                    <p>📍 Verification Radius: <span className="font-bold text-gray-700">{activeOffice.radius}m</span></p>
                    <p>🌐 Lat Coordinate: {activeOffice.latitude}° N</p>
                    <p>🌐 Lon Coordinate: {activeOffice.longitude}° E</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateOffice} className="bg-white p-5 rounded-xl border border-orange-100 shadow-md max-w-sm space-y-3 z-10">
                  <h4 className="font-bold text-gray-800 text-xs uppercase text-gray-400">Edit Office Configuration</h4>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Office Label Display Name</label>
                    <input 
                      type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none"
                      value={formName} onChange={(e) => setFormName(e.target.value)} required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Latitude</label>
                      <input 
                        type="number" step="any" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none"
                        value={formLat} onChange={(e) => setFormLat(e.target.value)} required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Longitude</label>
                      <input 
                        type="number" step="any" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none"
                        value={formLon} onChange={(e) => setFormLon(e.target.value)} required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Geofence Gate Radius (Meters)</label>
                    <input 
                      type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs outline-none"
                      value={formRadius} onChange={(e) => setFormRadius(e.target.value)} required
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="bg-[#F9A825] text-white font-bold text-xs py-2 rounded-lg flex-1">
                      Save Profile
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditingZone(false)} 
                      className="bg-gray-100 text-gray-600 text-xs py-2 rounded-lg px-3"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>

              <div className="flex justify-end z-10 mt-auto">
                <button 
                  type="button" onClick={startEditing}
                  className="bg-[#F9A825] text-white p-3.5 rounded-full shadow-lg hover:bg-orange-500 transition-all"
                >
                  <MapPin size={22} />
                </button>
              </div>
            </div>
          </div>

          {/* Presence Feed Display Container */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm mb-4">
              <Users className="text-[#F9A825]" size={18} />
              Live Presence Feed
            </div>
            
            <div className="overflow-y-auto max-h-[160px] space-y-2 pr-1">
              {/* FIXED LOOP: Filters list items by active drop down value and attaches strict unique key pairs */}
              {onSiteEmployees
                .filter(staff => staff.assignedOfficeId === selectedOfficeId)
                .map((staff, idx) => (
                  <div key={`${staff.userId}-${staff.id || idx}`} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center font-bold text-xs text-green-600">
                        ✔
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-gray-800">{staff.employeeName}</h5>
                        <p className="text-[10px] text-gray-400 font-mono font-medium">User ID: {staff.userId}</p>
                        <p className="text-[10px] text-[#F9A825] font-medium">Location: {staff.checkInLat?.toFixed(5)}°, {staff.checkInLon?.toFixed(5)}°</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-md">
                      🕒 {staff.checkInTime}
                    </span>
                  </div>
                ))}

              {/* FIXED CONDITIONAL EMPTY STATE: Computes empty notice accurately on the filtered results */}
              {onSiteEmployees.filter(staff => staff.assignedOfficeId === selectedOfficeId).length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">No mobile check-ins registered for this branch choice.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Shift Planner Interface */}
        <div className="col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full justify-between min-h-[640px]">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 text-base">Shift Planner</h3>
                <button type="button" className="text-[#F9A825] text-xs font-bold flex items-center gap-1">
                  <Calendar size={14} /> View Calendar
                </button>
              </div>

              <form onSubmit={handleCreateShift} className="bg-[#FFF4E5]/30 border border-orange-100/50 rounded-xl p-4 space-y-4 mb-6">
                <span className="text-[10px] font-bold text-[#F9A825] block uppercase tracking-wider">Quick Create Template</span>
                <input 
                  type="date" className="w-full bg-white border border-gray-100 rounded-lg p-2 text-xs text-gray-700 outline-none focus:border-[#F9A825]"
                  value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} required
                />
                <input 
                  type="text" placeholder="Shift Name (e.g. Morning 8 AM - 4 PM)" className="w-full bg-white border border-gray-100 rounded-lg p-2 text-xs text-gray-700 outline-none focus:border-[#F9A825]"
                  value={shiftName} onChange={(e) => setShiftName(e.target.value)} required
                />
                <button 
                  type="submit" disabled={shiftLoading}
                  className="w-full bg-[#F9A825] text-white text-xs font-bold py-2 rounded-lg shadow-sm hover:bg-orange-500 transition-colors disabled:opacity-50"
                >
                  {shiftLoading ? 'Saving...' : 'Save Template'}
                </button>
              </form>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-800">Shifts on This Day</h4>
                  <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {activeShifts.length} Active
                  </span>
                </div>

                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {activeShifts.map((shift, idx) => (
                    <div key={shift.id || `shift-${idx}`} className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                      <div className="flex gap-3 items-center">
                        <div className="w-1 h-8 bg-blue-600 rounded-full" />
                        <div>
                          <h5 className="text-xs font-bold text-gray-800 max-w-[180px] truncate">{shift.detail}</h5>
                          <p className="text-[10px] text-gray-400 font-medium">Assignee: {shift.employeeName}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {activeShifts.length === 0 && (
                    <p className="text-[11px] text-gray-400 text-center py-4">No schedules configured for this date choice</p>
                  )}
                </div>
              </div>
            </div>

            <button type="button" className="w-full mt-4 border-2 border-dashed border-gray-200 rounded-xl py-3 text-xs font-bold text-gray-500 flex items-center justify-center gap-2">
              <Plus size={16} /> Assign New Shift
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GeofencingPage;