// src/pages/dashboard/UserManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { Users, Mail, Search, Filter, MoreVertical, Shield, Briefcase, User as UserIcon, MapPin, Phone, Trash2, AlertTriangle, CheckCircle2, UserCheck } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import QuickInvite from '../../components/users/QuickInvite';
import BulkImport from '../../components/users/BulkImport';

const UserManagementPage = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [activeTab, setActiveTab] = useState('Employee'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); 
  const [dropdownOpenId, setDropdownOpenId] = useState(null);

  // Modals
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [newRoleSelection, setNewRoleSelection] = useState('');
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  
  // Assign Manager Modal
  const [managerModalUser, setManagerModalUser] = useState(null);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [managerModalStep, setManagerModalStep] = useState('select'); // 'select' or 'confirm'

  useEffect(() => {
    let currentUsers = []; let currentAdmins = []; let currentPending = [];

    const updateCombinedUsers = () => {
      const activePhones = new Set([...currentUsers, ...currentAdmins].map(u => u.phone ? String(u.phone).trim() : null).filter(Boolean));
      const filteredPending = currentPending.filter(u => !activePhones.has(u.phone));
      setAllUsers([...currentUsers, ...currentAdmins, ...filteredPending]);
      setLoading(false);
    };

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      currentUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), status: 'Active', sourceCollection: 'users' }));
      updateCombinedUsers();
    });

    const unsubscribeAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
      currentAdmins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), role: doc.data().role || 'Admin', status: 'Active', sourceCollection: 'admins' }));
      updateCombinedUsers();
    });

    const unsubscribePreAuth = onSnapshot(collection(db, 'pre_authorized_users'), (snapshot) => {
      currentPending = snapshot.docs.map(doc => {
        const data = doc.data();
        const invitePhone = data.phone ? String(data.phone).trim() : String(doc.id).trim();
        return { id: doc.id, ...data, phone: invitePhone, name: data.name || 'Invited User', status: 'Pending', sourceCollection: 'pre_authorized_users' };
      });
      updateCombinedUsers();
    });

    return () => { unsubscribeUsers(); unsubscribeAdmins(); unsubscribePreAuth(); };
  }, []);

  const availableManagers = allUsers.filter(u => u.status === 'Active' && (u.role === 'Manager' || u.role === 'Admin'));

  // Handlers
  const handleOpenManagerModal = (user) => {
    setManagerModalUser(user);
    setSelectedManagerId(user.managerId || '');
    setManagerModalStep('select'); // Always open on the selection step
    setDropdownOpenId(null);
  };

  const confirmManagerAssignment = async () => {
    if (!managerModalUser) return;
    setIsProcessing(true);
    try {
      const selectedManager = availableManagers.find(m => m.id === selectedManagerId);
      const userRef = doc(db, managerModalUser.sourceCollection, managerModalUser.id);
      
      // If user is Active (in users collection), save UID. If Pending, save the phone number for resolution upon registration.
      if (managerModalUser.status === 'Active') {
        await updateDoc(userRef, { managerId: selectedManager ? selectedManager.id : null, updatedAt: serverTimestamp() });
      } else {
        await updateDoc(userRef, { assignedManagerPhone: selectedManager ? selectedManager.phone : null, updatedAt: serverTimestamp() });
      }
    } catch (error) { console.error("Error updating manager:", error); } 
    finally { setIsProcessing(false); setManagerModalUser(null); }
  };

  const handleOpenRoleModal = (user) => { setRoleModalUser(user); setNewRoleSelection(user.role || 'Employee'); setDropdownOpenId(null); };
  const handleOpenDeleteModal = (user) => { setDeleteModalUser(user); setDropdownOpenId(null); };
  
  const confirmRoleChange = async () => {
    if (!roleModalUser || !newRoleSelection || roleModalUser.role === newRoleSelection) return setRoleModalUser(null);
    setIsProcessing(true);
    try { await updateDoc(doc(db, roleModalUser.sourceCollection, roleModalUser.id), { role: newRoleSelection, updatedAt: serverTimestamp() }); } 
    finally { setIsProcessing(false); setRoleModalUser(null); }
  };

  const confirmDeleteUser = async () => {
    if (!deleteModalUser) return;
    setIsProcessing(true);
    try {
      await addDoc(collection(db, 'trash_bin'), { originalCollection: deleteModalUser.sourceCollection, originalId: deleteModalUser.id, deletedAt: serverTimestamp(), itemMemoryData: { ...deleteModalUser } });
      await deleteDoc(doc(db, deleteModalUser.sourceCollection, deleteModalUser.id));
    } finally { setIsProcessing(false); setDeleteModalUser(null); }
  };

  const totalStaff = allUsers.filter(u => u.status === 'Active').length;
  const pendingInvites = allUsers.filter(u => u.status === 'Pending').length;
  const displayedUsers = allUsers.filter(user => {
    const matchesTab = user.role === activeTab;
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (user.name && user.name.toLowerCase().includes(searchLower)) || (user.phone && String(user.phone).includes(searchLower));
    return matchesTab && matchesStatus && matchesSearch;
  });

  return (
    <div className="p-10 relative max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Staff Members</p>
            <h3 className="text-3xl font-black text-gray-800">{loading ? '-' : totalStaff}</h3>
            <p className="text-xs text-gray-500 mt-1 font-medium">Registered & active accounts</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Users size={24} /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pending Invites</p>
            <h3 className="text-3xl font-black text-gray-800">{loading ? '-' : pendingInvites}</h3>
            <p className="text-xs text-gray-500 mt-1 font-medium">Awaiting registration completion</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50 text-[#F9A825] flex items-center justify-center"><Mail size={24} /></div>
        </div>
      </div>

      {/* MAIN DATA TABLE SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible mb-8">
        <div className="p-6 border-b border-gray-100 space-y-4">
          <div className="flex gap-6 border-b border-gray-200">
            <button onClick={() => setActiveTab('Employee')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 outline-none cursor-pointer ${activeTab === 'Employee' ? 'border-[#F9A825] text-[#F9A825]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}><UserIcon size={16} /> Employees</button>
            <button onClick={() => setActiveTab('Manager')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 outline-none cursor-pointer ${activeTab === 'Manager' ? 'border-[#F9A825] text-[#F9A825]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}><Briefcase size={16} /> Managers</button>
            <button onClick={() => setActiveTab('Admin')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 outline-none cursor-pointer ${activeTab === 'Admin' ? 'border-[#F9A825] text-[#F9A825]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}><Shield size={16} /> Admins</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search by name or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm font-medium py-3 pl-11 pr-4 rounded-xl outline-none focus:border-[#F9A825]" />
            </div>
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm font-medium py-3 pl-11 pr-4 rounded-xl outline-none focus:border-[#F9A825] cursor-pointer appearance-none">
                <option value="All">All Statuses</option><option value="Active">Active (Registered)</option><option value="Pending">Pending (Invited)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-visible">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider pl-6">Account Details</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Manager / Location</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayedUsers.map((user) => {
                // Find manager name if assigned
                let managerDisplay = 'Unassigned';
                if (user.managerId) {
                  const m = availableManagers.find(mgr => mgr.id === user.managerId);
                  if (m) managerDisplay = `Mgr: ${m.name}`;
                } else if (user.assignedManagerPhone) {
                  const m = availableManagers.find(mgr => mgr.phone === user.assignedManagerPhone);
                  managerDisplay = m ? `Mgr: ${m.name}` : `Mgr: ${user.assignedManagerPhone}`;
                }

                return (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-50 text-[#F9A825] font-bold flex items-center justify-center flex-shrink-0">
                        {user.name && user.name !== 'Invited User' ? user.name.charAt(0).toUpperCase() : <Phone size={16} />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone size={10} /> {user.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                      <span className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400" /> {user.assignedOfficeId || 'Global Access'}</span>
                      <span className="flex items-center gap-1.5 text-xs text-amber-600"><UserCheck size={14} className="text-[#F9A825]" /> {managerDisplay}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>{user.status}</span>
                  </td>
                  
                  <td className="p-4 text-right pr-6 relative">
                    <button onClick={() => setDropdownOpenId(dropdownOpenId === user.id ? null : user.id)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-800 rounded-lg cursor-pointer"><MoreVertical size={18} /></button>
                    {dropdownOpenId === user.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpenId(null)}></div>
                        <div className="absolute right-6 top-10 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          <button onClick={() => handleOpenManagerModal(user)} className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2"><UserCheck size={16} className="text-[#F9A825]" /> Assign Manager</button>
                          <button onClick={() => handleOpenRoleModal(user)} className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-50"><Shield size={16} className="text-[#F9A825]" /> Change Role</button>
                          <button onClick={() => handleOpenDeleteModal(user)} className="w-full text-left px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-gray-50"><Trash2 size={16} className="text-rose-500" /> Remove User</button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              )})}
              {!loading && displayedUsers.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-16 text-center">
                    <Users size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-bold text-gray-500">No users found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <QuickInvite />
        <BulkImport />
      </div>

      {/* ========================================= */}
      {/* MODAL: ASSIGN MANAGER                       */}
      {/* ========================================= */}
      {managerModalUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-amber-50 text-[#F9A825] rounded-2xl flex items-center justify-center mx-auto mb-4"><UserCheck size={24} /></div>
            
            {managerModalStep === 'select' ? (
              <>
                <h3 className="text-base font-black text-gray-900 tracking-tight">Assign Manager</h3>
                <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">Select a direct reporting manager for <strong>{managerModalUser.name}</strong>.</p>
                
                <div className="mt-5 text-left">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Available Managers</label>
                  <select value={selectedManagerId} onChange={(e) => setSelectedManagerId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 py-3 px-4 rounded-xl outline-none focus:border-[#F9A825] transition-colors cursor-pointer">
                    <option value="">-- Unassigned --</option>
                    {availableManagers.map(mgr => (
                      <option key={mgr.id} value={mgr.id}>{mgr.name} ({mgr.role})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button onClick={() => setManagerModalUser(null)} className="bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold py-3 rounded-xl border border-gray-100 transition-all cursor-pointer">Cancel</button>
                  <button onClick={() => setManagerModalStep('confirm')} className="bg-[#F9A825] hover:bg-amber-600 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-sm cursor-pointer">
                    Proceed
                  </button>
                </div>
              </>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                <h3 className="text-base font-black text-gray-900 tracking-tight">Confirm Assignment</h3>
                <p className="text-sm text-gray-500 mt-2 mb-6 leading-relaxed px-2">
                  Are you sure you want to assign <strong>{selectedManagerId ? availableManagers.find(m => m.id === selectedManagerId)?.name : 'No Manager (Unassigned)'}</strong> as the direct reporting manager for <strong>{managerModalUser.name}</strong>?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setManagerModalStep('select')} disabled={isProcessing} className="bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold py-3 rounded-xl border border-gray-100 transition-all cursor-pointer">Back</button>
                  <button onClick={confirmManagerAssignment} disabled={isProcessing} className="bg-[#F9A825] hover:bg-amber-600 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {isProcessing ? 'Saving...' : <><CheckCircle2 size={14} /> Yes, Confirm</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL: CHANGE ROLE CONFIRMATION           */}
      {/* ========================================= */}
      {roleModalUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-amber-50 text-[#F9A825] rounded-2xl flex items-center justify-center mx-auto mb-4"><Shield size={24} /></div>
            <h3 className="text-base font-black text-gray-900 tracking-tight">Modify User Role</h3>
            <div className="mt-5 text-left">
              <select value={newRoleSelection} onChange={(e) => setNewRoleSelection(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 py-3 px-4 rounded-xl outline-none focus:border-[#F9A825] cursor-pointer">
                <option value="Employee">Employee</option><option value="Manager">Manager</option><option value="Admin">Admin</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => setRoleModalUser(null)} disabled={isProcessing} className="bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold py-3 rounded-xl border border-gray-100 transition-all cursor-pointer">Cancel</button>
              <button onClick={confirmRoleChange} disabled={isProcessing || roleModalUser.role === newRoleSelection} className="bg-[#F9A825] hover:bg-amber-600 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50">Update Role</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL: REMOVE USER TRASH CONFIRMATION     */}
      {/* ========================================= */}
      {deleteModalUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} /></div>
            <h3 className="text-base font-black text-gray-900 tracking-tight">Remove User Account?</h3>
            <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed">Are you sure you want to remove <strong>{deleteModalUser.name}</strong> from the system?</p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => setDeleteModalUser(null)} disabled={isProcessing} className="bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold py-3 rounded-xl border border-gray-100 transition-all cursor-pointer">Cancel</button>
              <button onClick={confirmDeleteUser} disabled={isProcessing} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-sm cursor-pointer">{isProcessing ? 'Removing...' : 'Yes, Remove'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagementPage;