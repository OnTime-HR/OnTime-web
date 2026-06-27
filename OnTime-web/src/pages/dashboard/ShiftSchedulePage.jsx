// src/pages/dashboard/ShiftSchedulePage.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Moon, Sun, AlertCircle, Plus, X, Settings2, Pencil } from 'lucide-react';
import { db } from '../../services/firebase';
// NEW: Imported doc and updateDoc
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';

const ShiftSchedulePage = () => {
  const [shiftsList, setShiftsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- MODAL & FORM STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // NEW: State to track if we are editing an existing shift
  const [editingShiftId, setEditingShiftId] = useState(null); 
  
  const [shiftForm, setShiftForm] = useState({
    name: '',
    start_time: '08:00',
    end_time: '17:00',
    gracePeriodMinutes: 15,
    minimumHoursForFullDay: 4.5,
    crossesMidnight: false,
    requiredEmployees: 1
  });

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const shiftsSnapshot = await getDocs(collection(db, "shifts"));
      const shiftsData = shiftsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShiftsList(shiftsData);
    } catch (error) {
      console.error("Error fetching shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  // --- NEW: FUNCTION TO OPEN MODAL FOR A NEW SHIFT ---
  const handleOpenCreateModal = () => {
    setEditingShiftId(null); // Clear editing ID
    setShiftForm({
      name: '', start_time: '08:00', end_time: '17:00', gracePeriodMinutes: 15, minimumHoursForFullDay: 4.5, crossesMidnight: false, requiredEmployees: 1
    });
    setIsModalOpen(true);
  };

  // --- NEW: FUNCTION TO OPEN MODAL WITH EXISTING DATA ---
  const handleOpenEditModal = (shift) => {
    setEditingShiftId(shift.id); // Set the ID of the shift being edited
    setShiftForm({
      name: shift.name || '',
      start_time: shift.start_time || '08:00',
      end_time: shift.end_time || '17:00',
      gracePeriodMinutes: shift.gracePeriodMinutes || 0,
      minimumHoursForFullDay: shift.minimumHoursForFullDay || 0,
      crossesMidnight: shift.crossesMidnight || false,
      requiredEmployees: shift.requiredEmployees || 1
    });
    setIsModalOpen(true);
  };

  // --- UPDATED: FUNCTION HANDLES BOTH CREATE AND UPDATE ---
  const handleSaveShift = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formattedShift = {
        name: shiftForm.name,
        start_time: shiftForm.start_time,
        end_time: shiftForm.end_time,
        gracePeriodMinutes: Number(shiftForm.gracePeriodMinutes),
        minimumHoursForFullDay: Number(shiftForm.minimumHoursForFullDay),
        crossesMidnight: shiftForm.crossesMidnight,
        requiredEmployees: Number(shiftForm.requiredEmployees),
        lastUpdated: new Date().toISOString() // Track when it was changed
      };

      if (editingShiftId) {
        // If editing an existing shift, update the document
        const shiftRef = doc(db, "shifts", editingShiftId);
        await updateDoc(shiftRef, formattedShift);
        alert("Shift Template Updated Successfully!");
      } else {
        // If no editing ID, create a brand new document
        formattedShift.createdAt = new Date().toISOString();
        await addDoc(collection(db, "shifts"), formattedShift);
        alert("Shift Template Created Successfully!");
      }
      
      setIsModalOpen(false);
      fetchShifts(); // Refresh the UI
    } catch (error) {
      console.error("Error saving shift:", error);
      alert("Failed to save shift. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-10 relative max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings2 className="text-[#F9A825]" /> Shift Policies & Templates
          </h1>
          <p className="text-gray-500 text-sm mt-1">Define operational hours, grace periods, and rules.</p>
        </div>
        
        <button 
          onClick={handleOpenCreateModal} // Updated to use specific function
          className="bg-[#F9A825] hover:bg-amber-600 text-white font-bold text-sm py-2.5 px-5 rounded-xl shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> New Shift Template
        </button>
      </div>

      {/* SHIFT CARDS SECTION */}
      {loading ? (
        <div className="flex justify-center py-20 text-[#F9A825] font-bold">Loading Shift Templates...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shiftsList.map((shift) => (
            <div key={shift.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
              
              <div className={`absolute top-0 left-0 w-full h-1.5 ${shift.crossesMidnight ? 'bg-indigo-500' : 'bg-amber-400'}`}></div>

              <div className="flex justify-between items-start mb-4 mt-2">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg uppercase tracking-wide">{shift.name || "Unnamed Shift"}</h3>
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium mt-1">
                    <Clock size={14} className={shift.crossesMidnight ? 'text-indigo-500' : 'text-amber-500'} />
                    {shift.start_time} — {shift.end_time}
                  </div>
                </div>
                
                {/* NEW: Action Buttons Container */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenEditModal(shift)}
                    className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit Shift Policy"
                  >
                    <Pencil size={18} />
                  </button>
                  <div className={`p-2 rounded-xl ${shift.crossesMidnight ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-500'}`}>
                    {shift.crossesMidnight ? <Moon size={18} /> : <Sun size={18} />}
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-gray-50 rounded-xl p-4 mt-6 border border-gray-100/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-1.5">
                    <AlertCircle size={12} /> Grace Period
                  </span>
                  <span className="text-sm font-bold text-gray-800">{shift.gracePeriodMinutes || 0} Mins</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-1.5">
                    <Calendar size={12} /> Half-Day Min
                  </span>
                  <span className="text-sm font-bold text-gray-800">{shift.minimumHoursForFullDay || 0} Hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-1.5">
                    <Users size={12} /> Required Staff
                  </span>
                  <span className="text-sm font-bold text-gray-800">{shift.requiredEmployees || 1}</span>
                </div>
              </div>

            </div>
          ))}

          {shiftsList.length === 0 && (
            <div className="col-span-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center">
              <Settings2 size={32} className="text-gray-300 mb-3" />
              <h3 className="text-gray-900 font-bold">No Shift Templates Found</h3>
              <p className="text-sm text-gray-500 mt-1">Click the button above to define your first shift policy.</p>
            </div>
          )}
        </div>
      )}

      {/* --- ATTENDANCE PLACEHOLDER SECTION --- */}
      <div className="mt-16 pt-8 border-t border-gray-100">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Attendance Tracking</h2>
          <p className="text-sm text-gray-500 mt-1">Monitor clock-ins and daily roster execution.</p>
        </div>
        
        <div className="w-full h-64 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400">
          <Calendar size={32} className="mb-3 opacity-50" />
          <p className="font-semibold">Attendance view will be developed here</p>
        </div>
      </div>

      {/* --- CREATE / EDIT SHIFT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-[#F9A825] rounded-lg">
                  {/* Dynamic Icon based on mode */}
                  {editingShiftId ? <Pencil size={20} /> : <Settings2 size={20} />}
                </div>
                <div>
                  {/* Dynamic Title based on mode */}
                  <h2 className="font-bold text-gray-900 text-lg">
                    {editingShiftId ? 'Edit Shift Policy' : 'Define Shift Policy'}
                  </h2>
                  <p className="text-xs text-gray-500">Configure boundaries and tracking rules.</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="shift-form" onSubmit={handleSaveShift} className="space-y-6">
                
                {/* Section 1: Basics */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Basic Info</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Shift Name</label>
                      <input required type="text" placeholder="e.g., Night Support Shift" value={shiftForm.name} onChange={e => setShiftForm({...shiftForm, name: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F9A825] outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
                      <input required type="time" value={shiftForm.start_time} onChange={e => setShiftForm({...shiftForm, start_time: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F9A825] outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">End Time</label>
                      <input required type="time" value={shiftForm.end_time} onChange={e => setShiftForm({...shiftForm, end_time: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F9A825] outline-none transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Section 2: Advanced Policies */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Attendance Thresholds</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Grace Period (Minutes)</label>
                      <input required type="number" min="0" value={shiftForm.gracePeriodMinutes} onChange={e => setShiftForm({...shiftForm, gracePeriodMinutes: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F9A825] outline-none transition-colors" />
                      <p className="text-[10px] text-gray-400 mt-1">Time allowed before marked "Late"</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Half-Day Minimum (Hours)</label>
                      <input required type="number" step="0.5" min="1" value={shiftForm.minimumHoursForFullDay} onChange={e => setShiftForm({...shiftForm, minimumHoursForFullDay: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F9A825] outline-none transition-colors" />
                      <p className="text-[10px] text-gray-400 mt-1">Minimum hours to avoid "Half-Day"</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Required Employees</label>
                      <input required type="number" min="1" value={shiftForm.requiredEmployees} onChange={e => setShiftForm({...shiftForm, requiredEmployees: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F9A825] outline-none transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Section 3: Toggles */}
                <div className="pt-4 border-t border-gray-100">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                    <input type="checkbox" checked={shiftForm.crossesMidnight} onChange={e => setShiftForm({...shiftForm, crossesMidnight: e.target.checked})} className="w-5 h-5 accent-[#F9A825] cursor-pointer" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">Shift Crosses Midnight (Night Shift)</p>
                      <p className="text-[11px] text-gray-500">Enable this if the shift ends on the following calendar day.</p>
                    </div>
                  </label>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
                Cancel
              </button>
              {/* Dynamic Button Text based on mode */}
              <button type="submit" form="shift-form" disabled={isSaving} className="bg-[#F9A825] hover:bg-amber-600 text-white font-bold text-sm py-2.5 px-6 rounded-xl shadow-sm transition-colors disabled:opacity-50">
                {isSaving ? 'Saving...' : (editingShiftId ? 'Update Policy' : 'Save Shift Policy')}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftSchedulePage;