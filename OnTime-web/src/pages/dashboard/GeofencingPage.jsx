// src/pages/dashboard/GeofencingPage.jsx
import React, { useState, useEffect } from 'react';
import { Layers, Compass, MapPin, Users, Edit3, XCircle, CheckCircle, PlusCircle, Trash2, AlertTriangle } from 'lucide-react';
import ZoneMap from '../../components/dashboard/ZoneMap';
import NotificationToast from '../../components/dashboard/NotificationToast';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// FIXED: Consolidated imports to a single line
import { streamOfficeZones, updateOfficeZone, streamTodayCheckedInStaff, createOfficeZone, deleteOfficeZone } from '../../services/geofenceService';

const GeofencingPage = () => {
  const [offices, setOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState('');
  const [isEditingZone, setIsEditingZone] = useState(false);
  const [isCreatingNewZone, setIsCreatingNewZone] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formRadius, setFormRadius] = useState(50);
  const [formLat, setFormLat] = useState(6.7154669);
  const [formLon, setFormLon] = useState(80.7888601);

  const [shiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [onSiteEmployees, setOnSiteEmployees] = useState([]);
  const [toast, setToast] = useState({ isOpen: false, type: 'success', message: '' });

  const showToast = (type, message) => setToast({ isOpen: true, type, message });

  useEffect(() => {
    const unsubscribe = streamOfficeZones((officeList) => {
      setOffices(officeList);
      if (officeList.length > 0 && !selectedOfficeId && !isCreatingNewZone) {
        setSelectedOfficeId(officeList[0].id);
      }
    });
    return () => unsubscribe();
  }, [selectedOfficeId, isCreatingNewZone]);

  useEffect(() => {
    if (selectedOfficeId) {
      const unsubscribeOnSite = streamTodayCheckedInStaff(shiftDate, (checkedInStaff) => {
        setOnSiteEmployees(checkedInStaff);
      });
      return () => unsubscribeOnSite();
    }
  }, [shiftDate, selectedOfficeId]);

  const activeOffice = offices.find(o => o.id === selectedOfficeId) || {
    name: 'Loading...', radius: 50, latitude: 6.7154, longitude: 80.7888
  };

  const handleInitiateCreateMode = () => {
    setIsEditingZone(false);
    setSelectedOfficeId('');
    setFormId('NEW_CAMPUS_ID');
    setFormName('New Branch Name');
    setFormRadius(100);
    setFormLat(6.7154669);
    setFormLon(80.7888601);
    setIsCreatingNewZone(true);
  };

  const startEditing = () => {
    setFormName(activeOffice.name);
    setFormRadius(activeOffice.radius);
    setFormLat(activeOffice.latitude);
    setFormLon(activeOffice.longitude);
    setIsCreatingNewZone(false);
    setIsEditingZone(true);
  };

  const handleMarkerDragUpdate = (newLat, newLon) => {
    setFormLat(Number(newLat));
    setFormLon(Number(newLon));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isCreatingNewZone) {
        await createOfficeZone(formId, { name: formName, radius: Number(formRadius), latitude: Number(formLat), longitude: Number(formLon) });
        showToast("success", `New operational zone "${formName}" deployed successfully!`);
        setSelectedOfficeId(formId.toUpperCase().replace(/\s+/g, '_'));
        setIsCreatingNewZone(false);
      } else {
        await updateOfficeZone(selectedOfficeId, { name: formName, radius: Number(formRadius), latitude: Number(formLat), longitude: Number(formLon) });
        setIsEditingZone(false);
        showToast("success", "Office boundary coordinates synchronized with the cloud database!");
      }
    } catch (error) {
      showToast("error", error.message);
    }
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (!selectedOfficeId) return;

    try {
      // 1. Snapshot into Trash Bin
      await addDoc(collection(db, "trash_bin"), {
        originalCollection: "offices",
        originalId: selectedOfficeId,
        deletedAt: serverTimestamp(),
        itemMemoryData: {
          ...activeOffice,
          createdAt: activeOffice.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      });

      // 2. Call the service to delete from the active collection
      await deleteOfficeZone(selectedOfficeId);

      showToast("success", "Location moved to Trash Bin.");

      // 3. Reset selection to trigger list update
      setSelectedOfficeId('');
    } catch (error) {
      showToast("error", "Deletion failure: " + error.message);
    }
  };

  const handleCancelAction = () => {
    setIsEditingZone(false);
    setIsCreatingNewZone(false);
    if (offices.length > 0) setSelectedOfficeId(offices[0].id);
  };

  return (
    // FIXED: Adjusted padding logic for better layout alignment
    <div className="p-4 md:p-8 w-full animate-in fade-in duration-300">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 flex flex-col space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[460px] relative">
            <div className="bg-[#FFF4E5]/50 px-6 py-4 border-b border-orange-50 flex justify-between items-center z-10">
              <div className="flex items-center gap-3 font-bold text-gray-800 text-sm flex-1">
                <MapPin className="text-[#F9A825]" size={18} />
                <span>Zone Branch Context:</span>
                {!isCreatingNewZone ? (
                  <select className="bg-white border border-orange-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-600 outline-none focus:border-[#F9A825] cursor-pointer" value={selectedOfficeId} onChange={(e) => { setSelectedOfficeId(e.target.value); setIsEditingZone(false); }}>
                    {offices.map(off => (
                      <option key={off.id} value={off.id}>{off.id} ({off.name})</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-lg font-black tracking-wide">CREATING NEW LOCATION CORE</span>
                )}
              </div>
              {!isEditingZone && !isCreatingNewZone && (
                <button type="button" onClick={handleInitiateCreateMode} className="flex items-center gap-1.5 bg-[#F9A825] hover:bg-orange-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-colors mr-4">
                  <PlusCircle size={14} /> Add New Zone
                </button>
              )}
            </div>
            <div className="flex-1 w-full h-full relative p-4 bg-gray-50 flex flex-col">
              <ZoneMap latitude={isEditingZone || isCreatingNewZone ? formLat : activeOffice.latitude} longitude={isEditingZone || isCreatingNewZone ? formLon : activeOffice.longitude} radius={isEditingZone || isCreatingNewZone ? formRadius : activeOffice.radius} isEditing={isEditingZone || isCreatingNewZone} onMarkerDrag={handleMarkerDragUpdate} />
            </div>
          </div>

          {!isCreatingNewZone && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-gray-900 text-sm mb-4">
                <Users className="text-[#F9A825]" size={18} /> Live Presence Feed
              </div>
              <div className="overflow-y-auto max-h-[160px] space-y-2 pr-1">
                {onSiteEmployees.filter(staff => staff.assignedOfficeId === selectedOfficeId).map((staff, idx) => (
                  <div key={`${staff.userId}-${staff.id || idx}`} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center font-bold text-xs text-green-600">✔</div>
                      <div>
                        <h5 className="text-xs font-bold text-gray-800">{staff.employeeName}</h5>
                        <p className="text-[10px] text-[#F9A825] font-medium">Location: {staff.checkInLat?.toFixed(5)}°, {staff.checkInLon?.toFixed(5)}°</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-md">🕒 {staff.checkInTime}</span>
                  </div>
                ))}
                {onSiteEmployees.filter(staff => staff.assignedOfficeId === selectedOfficeId).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6">No mobile check-ins registered for this branch choice.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[460px]">
            {!isEditingZone && !isCreatingNewZone ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                  <h3 className="font-bold text-gray-900 text-base">Zone Parameters</h3>
                  <span className="bg-green-50 text-green-600 text-[10px] px-2.5 py-1 rounded-full font-bold">{onSiteEmployees.filter(emp => emp.assignedOfficeId === selectedOfficeId).length} Active On-site</span>
                </div>
                <div className="bg-[#FFF4E5]/30 rounded-2xl border border-orange-100/50 p-5 space-y-4">
                  <div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Office Identifier</span><h4 className="font-mono text-sm font-black text-gray-700 tracking-wide">{selectedOfficeId}</h4></div>
                  <div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Campus Hub Label</span><h4 className="font-black text-[#F9A825] text-lg leading-tight">{activeOffice.name} Campus</h4></div>
                </div>
                <div className="p-2 space-y-3.5">
                  <div className="flex justify-between text-xs font-semibold"><span className="text-gray-400">📍 Fence Radius Check:</span><span className="text-gray-800 font-bold">{activeOffice.radius} meters</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-gray-400">🌐 Lat coordinate:</span><span className="text-gray-700 font-mono">{activeOffice.latitude}° N</span></div>
                  <div className="flex justify-between text-xs font-semibold"><span className="text-gray-400">🌐 Lon coordinate:</span><span className="text-gray-700 font-mono">{activeOffice.longitude}° E</span></div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setShowDeleteConfirm(true)} className="w-12 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors flex items-center justify-center outline-none cursor-pointer"><Trash2 size={16} /></button>
                  <button type="button" onClick={startEditing} className="flex-1 bg-[#F9A825] hover:bg-orange-500 text-white text-xs font-bold py-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 outline-none cursor-pointer"><Edit3 size={14} /> Adjust Coordinates</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div className="border-b border-gray-50 pb-4">
                  <h3 className="font-bold text-gray-900 text-base">{isCreatingNewZone ? "Register Fresh Zone" : "Modify Boundary Config"}</h3>
                  <p className="text-[11px] text-orange-500 font-medium mt-1 animate-pulse">💡 Hint: You can drag the marker pin on the map to set coordinates visually.</p>
                </div>
                <div className="space-y-4">
                  {isCreatingNewZone && (
                    <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Custom Unique ID (No Spaces)</label><input type="text" placeholder="e.g., SE_CAMPUS_SUSL" className="w-full bg-gray-50 border border-gray-200 text-xs font-mono font-bold text-gray-700 p-3 rounded-xl outline-none focus:border-[#F9A825] transition-colors uppercase" value={formId} onChange={(e) => setFormId(e.target.value.replace(/\s+/g, '_'))} required /></div>
                  )}
                  <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Campus Location Title</label><input type="text" className="w-full bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 p-3 rounded-xl outline-none focus:border-[#F9A825] transition-colors" value={formName} onChange={(e) => setFormName(e.target.value)} required /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Latitude</label><input type="number" step="any" className="w-full bg-gray-50 border border-gray-200 font-mono text-xs p-3 rounded-xl outline-none focus:border-[#F9A825] transition-colors" value={formLat} onChange={(e) => setFormLat(e.target.value)} required /></div>
                    <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Longitude</label><input type="number" step="any" className="w-full bg-gray-50 border border-gray-200 font-mono text-xs p-3 rounded-xl outline-none focus:border-[#F9A825] transition-colors" value={formLon} onChange={(e) => setFormLon(e.target.value)} required /></div>
                  </div>
                  <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Geofence Radius (Meters)</label><input type="number" className="w-full bg-gray-50 border border-gray-200 text-xs font-bold p-3 rounded-xl outline-none focus:border-[#F9A825] transition-colors" value={formRadius} onChange={(e) => setFormRadius(e.target.value)} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button type="button" onClick={handleCancelAction} className="w-full bg-gray-50 border border-gray-200 text-gray-500 text-xs font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"><XCircle size={14} /> Cancel</button>
                  <button type="submit" className="w-full bg-[#F9A825] hover:bg-orange-500 text-white text-xs font-bold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"><CheckCircle size={14} /> {isCreatingNewZone ? "Deploy Zone" : "Commit Changes"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mx-auto mb-4"><AlertTriangle size={24} /></div>
            <h4 className="text-base font-bold text-gray-900 mb-1">Move to Trash Bin</h4>
            <p className="text-xs text-gray-400 leading-relaxed px-2 mb-6">Are you sure you want to remove this location zone? It will be moved to the Trash Bin and can be restored within 30 days.</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 text-xs font-bold py-3 rounded-xl transition-colors">Cancel</button>
              <button type="button" onClick={handleConfirmDelete} className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-3 rounded-xl shadow-sm transition-all">Move to Trash</button>
            </div>
          </div>
        </div>
      )}

      <NotificationToast isOpen={toast.isOpen} type={toast.type} message={toast.message} onClose={() => setToast(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
};

export default GeofencingPage;