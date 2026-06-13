// src/pages/dashboard/GeofencingPage.jsx
import React, { useState, useEffect } from 'react';
import { Layers, Compass, MapPin, Users, Edit3, XCircle, CheckCircle } from 'lucide-react';
import { streamOfficeZones, updateOfficeZone, streamTodayCheckedInStaff } from '../../services/geofenceService';
import ZoneMap from '../../components/dashboard/ZoneMap';

const GeofencingPage = () => {
  const [offices, setOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState('');
  const [isEditingZone, setIsEditingZone] = useState(false);

  // Form input management states
  const [formName, setFormName] = useState('');
  const [formRadius, setFormRadius] = useState(50);
  const [formLat, setFormLat] = useState(6.7154669);
  const [formLon, setFormLon] = useState(80.7888601);

  const [shiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [onSiteEmployees, setOnSiteEmployees] = useState([]);

  // 1. Establish live stream listener to active office parameters
  useEffect(() => {
    const unsubscribe = streamOfficeZones((officeList) => {
      setOffices(officeList);
      if (officeList.length > 0 && !selectedOfficeId) {
        setSelectedOfficeId(officeList[0].id);
      }
    });
    return () => unsubscribe();
  }, [selectedOfficeId]);

  // 2. Stream real-time personnel entries mapped uniquely to active date choice
  useEffect(() => {
    const unsubscribeOnSite = streamTodayCheckedInStaff(shiftDate, (checkedInStaff) => {
      setOnSiteEmployees(checkedInStaff);
    });
    return () => unsubscribeOnSite();
  }, [shiftDate]);

  // Isolate current active selected branch configuration metrics
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

  // Helper listener logic to bind coordinate extraction changes from pin manipulation directly
  const handleMarkerDragUpdate = (newLat, newLon) => {
    setFormLat(Number(newLat));
    setFormLon(Number(newLon));
  };

  const handleUpdateOffice = async (e) => {
    if (e) e.preventDefault();
    try {
      await updateOfficeZone(selectedOfficeId, {
        name: formName,
        radius: Number(formRadius),
        latitude: Number(formLat),
        longitude: Number(formLon)
      });
      setIsEditingZone(false);
      alert("Office coordinates and zone dimensions successfully synchronized with cloud database!");
    } catch (error) {
      alert("Failed to write coordinates: " + error.message);
    }
  };

  return (
    <div className="p-10">
      <div className="grid grid-cols-12 gap-8">

        {/* ========================================================= */}
        {/* LEFT COLUMN: INTERACTIVE LEAFLET VISUAL SYSTEM FIELD MAP */}
        {/* ========================================================= */}
        <div className="col-span-8 flex flex-col space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[460px] relative">

            {/* REWRITTEN CLEAN SYSTEM HEADER BLOCK ROW */}
            <div className="bg-[#FFF4E5]/50 px-6 py-4 border-b border-orange-50 flex justify-between items-center z-10">
              <div className="flex items-center gap-3 font-bold text-gray-800 text-sm">
                <MapPin className="text-[#F9A825]" size={18} />
                <span>Zone Branch Context:</span>
                <select
                  className="bg-white border border-orange-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-600 outline-none focus:border-[#F9A825] cursor-pointer"
                  value={selectedOfficeId}
                  onChange={(e) => {
                    setSelectedOfficeId(e.target.value);
                    setIsEditingZone(false);
                  }}
                >
                  {offices.map(off => (
                    <option key={off.id} value={off.id}>{off.id} ({off.name})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* LIVE REACT-LEAFLET CANVAS RENDERING MAP LAYOUT BLOCK */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <ZoneMap
                latitude={isEditingZone ? formLat : activeOffice.latitude}
                longitude={isEditingZone ? formLon : activeOffice.longitude}
                radius={isEditingZone ? formRadius : activeOffice.radius}
                isEditing={isEditingZone}
                onMarkerDrag={handleMarkerDragUpdate}
              />
            </div>
          </div>

          {/* Live Presence Feed Display Container stays bottom-left unchanged */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm mb-4">
              <Users className="text-[#F9A825]" size={18} />
              Live Presence Feed
            </div>

            <div className="overflow-y-auto max-h-[160px] space-y-2 pr-1">
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

              {onSiteEmployees.filter(staff => staff.assignedOfficeId === selectedOfficeId).length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">No mobile check-ins registered for this branch choice.</p>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: REPOSITIONED CONFIGURATION & METRICS CARD */}
        {/* ========================================================= */}
        <div className="col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[460px]">

            {!isEditingZone ? (
              // READ-ONLY CONFIGURATION STATE VIEW
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                  <h3 className="font-bold text-gray-900 text-base">Zone Parameters</h3>
                  <span className="bg-green-50 text-green-600 text-[10px] px-2.5 py-1 rounded-full font-bold">
                    {onSiteEmployees.filter(emp => emp.assignedOfficeId === selectedOfficeId).length} Active On-site
                  </span>
                </div>

                <div className="bg-[#FFF4E5]/30 rounded-2xl border border-orange-100/50 p-5 space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Office Signature Identifier</span>
                    <h4 className="font-mono text-sm font-black text-gray-700 tracking-wide">{selectedOfficeId}</h4>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Campus Deployment Hub Label</span>
                    <h4 className="font-black text-[#F9A825] text-lg leading-tight">{activeOffice.name} Campus</h4>
                  </div>
                </div>

                <div className="p-2 space-y-3.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-400">📍 Fence Radius Check:</span>
                    <span className="text-gray-800 font-bold">{activeOffice.radius} meters</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-400">🌐 Lat coordinate string:</span>
                    <span className="text-gray-700 font-mono">{activeOffice.latitude}° N</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-400">🌐 Lon coordinate string:</span>
                    <span className="text-gray-700 font-mono">{activeOffice.longitude}° E</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startEditing}
                  className="w-full bg-[#F9A825] hover:bg-orange-500 text-white text-xs font-bold py-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  <Edit3 size={14} /> Adjust Spatial Coordinates
                </button>
              </div>
            ) : (
              // EDITABLE INPUT FORMS TRANSITION MATRIX WITH INTERACTIVE FEEDBACK PROMPT
              <form onSubmit={handleUpdateOffice} className="space-y-5">
                <div className="border-b border-gray-50 pb-4">
                  <h3 className="font-bold text-gray-900 text-base">Modify Boundary Config</h3>
                  <p className="text-[11px] text-orange-500 font-medium mt-1 animate-pulse">💡 Tip: Drag the marker pin directly on the map interface layout to extract live map coordinates.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Campus Display Name</label>
                    <input
                      type="text" className="w-full bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 p-3 rounded-xl outline-none focus:border-[#F9A825] transition-colors"
                      value={formName} onChange={(e) => setFormName(e.target.value)} required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Latitude Point</label>
                      <input
                        type="number" step="any" className="w-full bg-gray-50 border border-gray-200 font-mono text-xs p-3 rounded-xl outline-none focus:border-[#F9A825] transition-colors"
                        value={formLat} onChange={(e) => setFormLat(e.target.value)} required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Longitude Point</label>
                      <input
                        type="number" step="any" className="w-full bg-gray-50 border border-gray-200 font-mono text-xs p-3 rounded-xl outline-none focus:border-[#F9A825] transition-colors"
                        value={formLon} onChange={(e) => setFormLon(e.target.value)} required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Geofence Limit Radius (Meters)</label>
                    <input
                      type="number" className="w-full bg-gray-50 border border-gray-200 text-xs font-bold p-3 rounded-xl outline-none focus:border-[#F9A825] transition-colors"
                      value={formRadius} onChange={(e) => setFormRadius(e.target.value)} required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditingZone(false)} className="w-full bg-gray-50 border border-gray-200 text-gray-500 text-xs font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                    <XCircle size={14} /> Cancel
                  </button>
                  <button type="submit" className="w-full bg-[#F9A825] hover:bg-orange-500 text-white text-xs font-bold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5">
                    <CheckCircle size={14} /> Commit Changes
                  </button>
                </div>
              </form>
            )}

            <div className="text-[10px] text-gray-400 text-center font-medium mt-auto pt-6 border-t border-gray-50/60">
              Corporate Geofencing Architecture v2.0 • Secured Console Instance
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GeofencingPage;