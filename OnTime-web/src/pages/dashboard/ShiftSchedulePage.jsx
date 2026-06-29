// src/pages/dashboard/ShiftSchedulePage.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Moon, Sun, AlertCircle, Plus, X, Settings2, Pencil, Trash2, AlertTriangle, UserPlus, CheckCircle2, MapPin } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const ShiftSchedulePage = () => {
  const [shiftsList, setShiftsList] = useState([]);
  const [managersList, setManagersList] = useState([]);
  const [officesList, setOfficesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- ATTENDANCE STATE ---
  const [attendanceData, setAttendanceData] = useState([]);
  const [activeAttendanceTab, setActiveAttendanceTab] = useState('employees');

  // --- MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState(null); 
  const [deleteModalItem, setDeleteModalItem] = useState(null); 
  
  // --- MANAGER ALLOCATION MODAL STATES ---
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [activeShiftForManagers, setActiveShiftForManagers] = useState(null);
  
  // Now stores objects: [{ id: "managerId", locationId: "officeId", startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD" }]
  const [tempAssignedManagers, setTempAssignedManagers] = useState([]); 
  
  const [shiftForm, setShiftForm] = useState({
    name: '',
    start_time: '08:00',
    end_time: '17:00',
    gracePeriodMinutes: 15,
    minimumHoursForFullDay: 4.5,
    crossesMidnight: false,
    requiredEmployees: 1,
  });

  const formatLocation = (loc) => {
    if (!loc) return "Not available";
    if (typeof loc === 'string') return loc; 
    if (loc.latitude && loc.longitude) return `${loc.latitude.toFixed(4)}°, ${loc.longitude.toFixed(4)}°`;
    if (loc._lat && loc._long) return `${loc._lat.toFixed(4)}°, ${loc._long.toFixed(4)}°`;
    return "Location Logged"; 
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const shiftsSnapshot = await getDocs(collection(db, "shifts"));
      const shiftsData = shiftsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShiftsList(shiftsData);

      const managersQuery = query(collection(db, "users"), where("role", "==", "Manager"));
      const managersSnapshot = await getDocs(managersQuery);
      const managersData = managersSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || "Unnamed Manager"
      }));
      setManagersList(managersData);

      const officesSnapshot = await getDocs(collection(db, "offices"));
      const officesData = officesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.data().company_code || "Unnamed Location"
      }));
      setOfficesList(officesData);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toLocaleDateString('en-CA'); 
      const usersSnapshot = await getDocs(collection(db, "users"));
      const tempAttendance = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const attendanceSnap = await getDocs(collection(db, "users", userDoc.id, "attendance"));
        
        const todayRecord = attendanceSnap.docs.find(d => d.id === today);
        
        if (todayRecord) {
          tempAttendance.push({
            uid: userDoc.id,
            name: userData.name,
            role: userData.role || 'Employee',
            officeName: userData.assignedOfficeId || 'Unknown Location',
            ...todayRecord.data()
          });
        }
      }
      setAttendanceData(tempAttendance);
    } catch (error) {
      console.error("Error fetching live attendance:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTodayAttendance();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingShiftId(null);
    setShiftForm({
      name: '', start_time: '08:00', end_time: '17:00', gracePeriodMinutes: 15, minimumHoursForFullDay: 4.5, crossesMidnight: false, requiredEmployees: 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (shift) => {
    setEditingShiftId(shift.id);
    setShiftForm({
      name: shift.name || '',
      start_time: shift.start_time || '08:00',
      end_time: shift.end_time || '17:00',
      gracePeriodMinutes: shift.gracePeriodMinutes || 0,
      minimumHoursForFullDay: shift.minimumHoursForFullDay || 0,
      crossesMidnight: shift.crossesMidnight || false,
      requiredEmployees: shift.requiredEmployees || 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenManagerModal = (shift) => {
    setActiveShiftForManagers(shift);
    
    // Normalize data (safeguard for older shifts)
    const currentManagers = shift.assignedManagers || [];
    const normalized = currentManagers.map(m => 
      typeof m === 'string' ? { id: m, locationId: '', startDate: '', endDate: '' } : { startDate: '', endDate: '', ...m }
    );
    
    setTempAssignedManagers(normalized);
    setIsManagerModalOpen(true);
  };

  const toggleManagerSelection = (managerId) => {
    setTempAssignedManagers(prev => {
      const exists = prev.find(m => m.id === managerId);
      if (exists) {
        return prev.filter(m => m.id !== managerId); // Remove if unchecked
      } else {
        return [...prev, { id: managerId, locationId: '', startDate: '', endDate: '' }]; // Add with empty fields
      }
    });
  };

  const handleManagerLocationChange = (managerId, locationId) => {
    setTempAssignedManagers(prev => 
      prev.map(m => m.id === managerId ? { ...m, locationId } : m)
    );
  };

  // NEW: Handles start and end date updates for specific managers
  const handleManagerDateChange = (managerId, field, value) => {
    setTempAssignedManagers(prev => 
      prev.map(m => m.id === managerId ? { ...m, [field]: value } : m)
    );
  };

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
        lastUpdated: new Date().toISOString()
      };

      if (editingShiftId) {
        await updateDoc(doc(db, "shifts", editingShiftId), formattedShift);
      } else {
        formattedShift.createdAt = new Date().toISOString();
        formattedShift.assignedManagers = []; 
        await addDoc(collection(db, "shifts"), formattedShift);
      }
      setIsModalOpen(false);
      fetchData(); 
    } catch (error) {
      console.error("Error saving shift:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveManagers = async () => {
    if (!activeShiftForManagers) return;
    
    // Validation: Ensure all selected managers have a location and dates assigned
    const missingData = tempAssignedManagers.some(m => !m.locationId || !m.startDate || !m.endDate);
    if (missingData) {
      alert("Please ensure a location, start date, and end date are provided for all checked managers.");
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "shifts", activeShiftForManagers.id), { 
        assignedManagers: tempAssignedManagers,
        lastUpdated: new Date().toISOString()
      });
      setIsManagerModalOpen(false);
      fetchData(); 
    } catch (error) {
      console.error("Error saving managers:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const executeTrashDelete = async () => {
    if (!deleteModalItem) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, "trash_bin"), {
        originalCollection: 'shifts',
        originalId: deleteModalItem.id,
        deletedAt: new Date(),
        itemMemoryData: { ...deleteModalItem }
      });
      await deleteDoc(doc(db, "shifts", deleteModalItem.id));
      setDeleteModalItem(null);
      fetchData(); 
    } catch (error) {
      console.error("Error trashing shift:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const displayedAttendance = attendanceData.filter(record => {
    if (activeAttendanceTab === 'managers') return record.role === 'Manager';
    return record.role !== 'Manager'; 
  });

  return (
    <div className="p-10 relative max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings2 className="text-[#F9A825]" /> Shift Policies & Templates
          </h1>
          <p className="text-gray-500 text-sm mt-1">Define operational hours, set rules, and allocate managers to locations.</p>
        </div>
        
        <button 
          onClick={handleOpenCreateModal}
          className="bg-[#F9A825] hover:bg-amber-600 text-white font-bold text-sm py-2.5 px-5 rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
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
            <div key={shift.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
              
              <div className={`absolute top-0 left-0 w-full h-1.5 ${shift.crossesMidnight ? 'bg-indigo-500' : 'bg-amber-400'}`}></div>

              <div className="flex justify-between items-start mb-4 mt-2">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg uppercase tracking-wide">{shift.name || "Unnamed Shift"}</h3>
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium mt-1">
                    <Clock size={14} className={shift.crossesMidnight ? 'text-indigo-500' : 'text-amber-500'} />
                    {shift.start_time} — {shift.end_time}
                  </div>
                </div>
                
                <div className="flex gap-1.5">
                  <button onClick={() => handleOpenEditModal(shift)} className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer" title="Edit Shift Policy">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => setDeleteModalItem(shift)} className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Send to Trash">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 bg-gray-50 rounded-xl p-4 mt-2 border border-gray-100/50 flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-1.5"><AlertCircle size={12} /> Grace Period</span>
                  <span className="text-sm font-bold text-gray-800">{shift.gracePeriodMinutes || 0} Mins</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-1.5"><Calendar size={12} /> Half-Day Min</span>
                  <span className="text-sm font-bold text-gray-800">{shift.minimumHoursForFullDay || 0} Hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-1.5"><Users size={12} /> Required Staff</span>
                  <span className="text-sm font-bold text-gray-800">{shift.requiredEmployees || 1}</span>
                </div>
              </div>

              <button 
                onClick={() => handleOpenManagerModal(shift)}
                className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500 hover:text-[#F9A825] transition-colors group cursor-pointer w-full text-left outline-none"
              >
                <span className="flex items-center gap-1.5"><UserPlus size={14} className="group-hover:scale-110 transition-transform" /> Allocate Managers</span>
                <span className="bg-gray-100 group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors text-gray-700 px-2.5 py-1 rounded-md font-bold">{shift.assignedManagers?.length || 0}</span>
              </button>
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

      {/* --- ATTENDANCE TRACKING SECTION --- */}
      <div className="mt-16 pt-8 border-t border-gray-100">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Live Attendance Tracking</h2>
            <p className="text-sm text-gray-500 mt-1 mb-4">Real-time status of staff clock-ins and clock-outs for today.</p>
            
            <div className="flex gap-6 border-b border-gray-200">
              <button 
                onClick={() => setActiveAttendanceTab('employees')} 
                className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer outline-none ${activeAttendanceTab === 'employees' ? 'border-[#F9A825] text-[#F9A825]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                Employee Attendance
              </button>
              <button 
                onClick={() => setActiveAttendanceTab('managers')} 
                className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer outline-none ${activeAttendanceTab === 'managers' ? 'border-[#F9A825] text-[#F9A825]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                Manager Attendance
              </button>
            </div>
          </div>
          
          <button 
            onClick={fetchTodayAttendance} 
            className="mb-2 text-xs font-bold text-[#F9A825] hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Refresh Data
          </button>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Check-In</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Check-Out</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayedAttendance.map((record, index) => (
                <tr key={record.uid + index} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-gray-800">{record.name}</p>
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-600">{record.checkInTime || "--"}</td>
                  <td className="p-4 text-sm font-medium text-gray-600">{record.checkOutTime || "--"}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                      <MapPin size={14} className="text-gray-400" /> {record.officeName}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5" title="Exact GPS Check-in Coordinates">
                      {formatLocation(record.checkInLocation)}
                    </div>
                  </td>
                </tr>
              ))}
              {displayedAttendance.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-16 text-center">
                    <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-bold text-gray-500">No Records Found</p>
                    <p className="text-xs text-gray-400 mt-1">There are no attendance records for this group today.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- TRASH CONFIRMATION MODAL --- */}
      {deleteModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 size={24} /></div>
            <h3 className="text-base font-black text-gray-900 tracking-tight">Move to Trash?</h3>
            <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed">Are you sure you want to remove <strong>{deleteModalItem.name}</strong>? It will be moved to the Trash Bin where it can be recovered for 30 days.</p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => setDeleteModalItem(null)} disabled={isSaving} className="bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold py-3 rounded-xl border border-gray-100 transition-all cursor-pointer">Cancel</button>
              <button onClick={executeTrashDelete} disabled={isSaving} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-3 rounded-xl transition-all flex justify-center items-center cursor-pointer">{isSaving ? 'Moving...' : 'Move to Trash'}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- ALLOCATE MANAGERS MODAL (UPDATED WITH DATES) --- */}
      {isManagerModalOpen && activeShiftForManagers && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[5000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-[#F9A825] rounded-lg"><UserPlus size={20} /></div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">Allocate Managers</h2>
                  <p className="text-xs text-gray-500 line-clamp-1">Assigning to: <span className="font-bold text-gray-700">{activeShiftForManagers.name}</span></p>
                </div>
              </div>
              <button onClick={() => setIsManagerModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Available Managers</h3>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">{tempAssignedManagers.length} Selected</span>
              </div>
              
              {managersList.length === 0 ? (
                <div className="text-sm text-gray-500 bg-gray-50 p-6 rounded-xl border border-gray-100 text-center flex flex-col items-center gap-2">
                  <AlertCircle size={24} className="text-gray-300" />
                  No users with "Manager" role found in the database.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 p-1">
                  {managersList.map(manager => {
                    const assignedData = tempAssignedManagers.find(m => m.id === manager.id);
                    const isSelected = !!assignedData;

                    return (
                      <div key={manager.id} className={`flex flex-col gap-3 p-4 rounded-xl border transition-all ${isSelected ? 'border-[#F9A825] bg-amber-50/30 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => toggleManagerSelection(manager.id)} 
                            className="w-4 h-4 accent-[#F9A825] cursor-pointer" 
                          />
                          <span className={`text-sm font-semibold line-clamp-1 ${isSelected ? 'text-amber-900' : 'text-gray-700'}`}>{manager.name}</span>
                        </label>
                        
                        {/* Dynamic Settings appearing when selected */}
                        {isSelected && (
                          <div className="pl-7 pr-2 flex flex-col gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <MapPin size={10} /> Assign Operational Location
                              </label>
                              <select
                                value={assignedData.locationId || ''}
                                onChange={(e) => handleManagerLocationChange(manager.id, e.target.value)}
                                className="w-full text-xs p-2.5 border border-amber-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-[#F9A825] focus:ring-1 focus:ring-[#F9A825]"
                                required
                              >
                                <option value="" disabled>Select a location...</option>
                                {officesList.map(office => (
                                  <option key={office.id} value={office.id}>{office.name}</option>
                                ))}
                              </select>
                            </div>

                            {/* NEW: Date Range Selection */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                  Start Date
                                </label>
                                <input
                                  type="date"
                                  value={assignedData.startDate || ''}
                                  onChange={(e) => handleManagerDateChange(manager.id, 'startDate', e.target.value)}
                                  className="w-full text-xs p-2.5 border border-amber-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-[#F9A825] focus:ring-1 focus:ring-[#F9A825] cursor-pointer"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                  End Date
                                </label>
                                <input
                                  type="date"
                                  value={assignedData.endDate || ''}
                                  onChange={(e) => handleManagerDateChange(manager.id, 'endDate', e.target.value)}
                                  className="w-full text-xs p-2.5 border border-amber-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-[#F9A825] focus:ring-1 focus:ring-[#F9A825] cursor-pointer"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsManagerModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleSaveManagers} disabled={isSaving} className="bg-[#F9A825] hover:bg-amber-600 text-white font-bold text-sm py-2.5 px-6 rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer">
                {isSaving ? 'Saving...' : <><CheckCircle2 size={16} /> Save Allocations</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE / EDIT SHIFT POLICY MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[5000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-[#F9A825] rounded-lg">{editingShiftId ? <Pencil size={20} /> : <Settings2 size={20} />}</div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">{editingShiftId ? 'Edit Shift Policy' : 'Define Shift Policy'}</h2>
                  <p className="text-xs text-gray-500">Configure operational boundaries and time rules.</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="shift-form" onSubmit={handleSaveShift} className="space-y-6">
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

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Attendance Thresholds</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Grace Period (Minutes)</label>
                      <input required type="number" min="0" value={shiftForm.gracePeriodMinutes} onChange={e => setShiftForm({...shiftForm, gracePeriodMinutes: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F9A825] outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Half-Day Min (Hours)</label>
                      <input required type="number" step="0.5" min="1" value={shiftForm.minimumHoursForFullDay} onChange={e => setShiftForm({...shiftForm, minimumHoursForFullDay: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F9A825] outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Required Employees</label>
                      <input required type="number" min="1" value={shiftForm.requiredEmployees} onChange={e => setShiftForm({...shiftForm, requiredEmployees: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#F9A825] outline-none transition-colors" />
                    </div>
                  </div>
                </div>

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
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">Cancel</button>
              <button type="submit" form="shift-form" disabled={isSaving} className="bg-[#F9A825] hover:bg-amber-600 text-white font-bold text-sm py-2.5 px-6 rounded-xl shadow-sm transition-colors disabled:opacity-50 cursor-pointer">
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