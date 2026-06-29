// src/pages/dashboard/UserManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { Users, Mail, Search, Filter, MoreVertical, Shield, Briefcase, User as UserIcon, MapPin, Phone, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import QuickInvite from '../../components/users/QuickInvite';
import BulkImport from '../../components/users/BulkImport';

const UserManagementPage = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // UI States
  const [activeTab, setActiveTab] = useState('Employee'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); 
  const [dropdownOpenId, setDropdownOpenId] = useState(null);

  // Modal States
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [newRoleSelection, setNewRoleSelection] = useState('');
  const [deleteModalUser, setDeleteModalUser] = useState(null);

  useEffect(() => {
    let currentUsers = [];
    let currentAdmins = [];
    let currentPending = [];

    const updateCombinedUsers = () => {
      const activePhones = new Set(
        [...currentUsers, ...currentAdmins]
          .map(u => u.phone ? String(u.phone).trim() : null)
          .filter(Boolean)
      );

      const filteredPending = currentPending.filter(u => !activePhones.has(u.phone));
      setAllUsers([...currentUsers, ...currentAdmins, ...filteredPending]);
      setLoading(false);
    };

    // 1. Listen to Registered Users (Active)
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      currentUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: 'Active',
        sourceCollection: 'users' // Track where this user lives
      }));
      updateCombinedUsers();
    });

    // 2. Listen to Admin Accounts (Active)
    const unsubscribeAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
      currentAdmins = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: doc.data().role || 'Admin', 
        status: 'Active',
        sourceCollection: 'admins' // Track where this admin lives
      }));
      updateCombinedUsers();
    });

    // 3. Listen to Pre-Authorized Users (Pending Invites)
    const unsubscribePreAuth = onSnapshot(collection(db, 'pre_authorized_users'), (snapshot) => {
      currentPending = snapshot.docs.map(doc => {
        const data = doc.data();
        const invitePhone = data.phone ? String(data.phone).trim() : String(doc.id).trim();

        return {
          id: doc.id,
          ...data,
          phone: invitePhone, 
          name: data.name || 'Invited User',
          status: 'Pending',
          sourceCollection: 'pre_authorized_users' // Track where this invite lives
        };
      });
      updateCombinedUsers();
    });

    return () => {
      unsubscribeUsers();
      unsubscribeAdmins();
      unsubscribePreAuth();
    };
  }, []);

  // --- ACTION HANDLERS ---
  
  const handleOpenRoleModal = (user) => {
    setRoleModalUser(user);
    setNewRoleSelection(user.role || 'Employee');
    setDropdownOpenId(null);
  };

  const handleOpenDeleteModal = (user) => {
    setDeleteModalUser(user);
    setDropdownOpenId(null);
  };

  const confirmRoleChange = async () => {
    if (!roleModalUser || !newRoleSelection || roleModalUser.role === newRoleSelection) {
      setRoleModalUser(null);
      return;
    }

    setIsProcessing(true);
    try {
      // Update the user's role in their respective collection
      const userRef = doc(db, roleModalUser.sourceCollection, roleModalUser.id);
      await updateDoc(userRef, { 
        role: newRoleSelection,
        updatedAt: serverTimestamp() 
      });
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setIsProcessing(false);
      setRoleModalUser(null);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteModalUser) return;

    setIsProcessing(true);
    try {
      // 1. Move to Trash Bin
      await addDoc(collection(db, 'trash_bin'), {
        originalCollection: deleteModalUser.sourceCollection,
        originalId: deleteModalUser.id,
        deletedAt: serverTimestamp(),
        itemMemoryData: { ...deleteModalUser }
      });

      // 2. Delete from active collection
      await deleteDoc(doc(db, deleteModalUser.sourceCollection, deleteModalUser.id));
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setIsProcessing(false);
      setDeleteModalUser(null);
    }
  };

  // --- STATS & FILTERING ---
  const totalStaff = allUsers.filter(u => u.status === 'Active').length;
  const pendingInvites = allUsers.filter(u => u.status === 'Pending').length;

  const displayedUsers = allUsers.filter(user => {
    const matchesTab = user.role === activeTab;
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (user.name && user.name.toLowerCase().includes(searchLower)) || 
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.phone && String(user.phone).includes(searchLower));

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
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pending Invites</p>
            <h3 className="text-3xl font-black text-gray-800">{loading ? '-' : pendingInvites}</h3>
            <p className="text-xs text-gray-500 mt-1 font-medium">Awaiting registration completion</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50 text-[#F9A825] flex items-center justify-center">
            <Mail size={24} />
          </div>
        </div>
      </div>

      {/* MAIN DATA TABLE SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible mb-8">
        
        {/* TABS & FILTERS */}
        <div className="p-6 border-b border-gray-100 space-y-4">
          <div className="flex gap-6 border-b border-gray-200">
            <button onClick={() => setActiveTab('Employee')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 outline-none cursor-pointer ${activeTab === 'Employee' ? 'border-[#F9A825] text-[#F9A825]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              <UserIcon size={16} /> Employees
            </button>
            <button onClick={() => setActiveTab('Manager')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 outline-none cursor-pointer ${activeTab === 'Manager' ? 'border-[#F9A825] text-[#F9A825]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              <Briefcase size={16} /> Managers
            </button>
            <button onClick={() => setActiveTab('Admin')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 outline-none cursor-pointer ${activeTab === 'Admin' ? 'border-[#F9A825] text-[#F9A825]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              <Shield size={16} /> Admins
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search by name, email, or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm font-medium py-3 pl-11 pr-4 rounded-xl outline-none focus:border-[#F9A825] transition-colors" />
            </div>
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm font-medium py-3 pl-11 pr-4 rounded-xl outline-none focus:border-[#F9A825] transition-colors appearance-none cursor-pointer">
                <option value="All">All Statuses</option>
                <option value="Active">Active (Registered)</option>
                <option value="Pending">Pending (Invited)</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-visible">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider pl-6">Account Details</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Location</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-50 text-[#F9A825] font-bold flex items-center justify-center flex-shrink-0">
                        {user.name && user.name !== 'Invited User' ? user.name.charAt(0).toUpperCase() : <Phone size={16} />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          {user.email ? <Mail size={10} /> : <Phone size={10} />}
                          {user.email || user.phone || 'No contact info'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                      <MapPin size={14} className="text-gray-400" />
                      {user.assignedOfficeId || (user.role === 'Admin' ? 'Global Access' : 'Unassigned')}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      user.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  
                  {/* --- NEW ACTION MENU --- */}
                  <td className="p-4 text-right pr-6 relative">
                    <button 
                      onClick={() => setDropdownOpenId(dropdownOpenId === user.id ? null : user.id)}
                      className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-colors cursor-pointer outline-none"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {/* Action Dropdown Portal */}
                    {dropdownOpenId === user.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpenId(null)}></div>
                        <div className="absolute right-6 top-10 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          <button onClick={() => handleOpenRoleModal(user)} className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                            <Shield size={16} className="text-gray-400" /> Change Role
                          </button>
                          <button onClick={() => handleOpenDeleteModal(user)} className="w-full text-left px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors border-t border-gray-50">
                            <Trash2 size={16} className="text-rose-500" /> Remove User
                          </button>
                        </div>
                      </>
                    )}
                  </td>

                </tr>
              ))}
              
              {/* EMPTY STATE */}
              {!loading && displayedUsers.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-16 text-center">
                    <Users size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-bold text-gray-500">No users found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search or status filter.</p>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan="4" className="p-16 text-center text-[#F9A825] font-bold text-sm">
                    Loading directory...
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
      {/* MODAL: CHANGE ROLE CONFIRMATION           */}
      {/* ========================================= */}
      {roleModalUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-amber-50 text-[#F9A825] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield size={24} />
            </div>
            <h3 className="text-base font-black text-gray-900 tracking-tight">Modify User Role</h3>
            <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
              Select a new permission level for <strong>{roleModalUser.name}</strong>.
            </p>
            
            <div className="mt-5 text-left">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">New Security Role</label>
              <select 
                value={newRoleSelection}
                onChange={(e) => setNewRoleSelection(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 py-3 px-4 rounded-xl outline-none focus:border-[#F9A825] transition-colors appearance-none cursor-pointer"
              >
                <option value="Employee">Employee (Standard Access)</option>
                <option value="Manager">Manager (Branch Access)</option>
                <option value="Admin">Admin (Full Console Access)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => setRoleModalUser(null)} disabled={isProcessing} className="bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold py-3 rounded-xl border border-gray-100 transition-all cursor-pointer">
                Cancel
              </button>
              <button onClick={confirmRoleChange} disabled={isProcessing || roleModalUser.role === newRoleSelection} className="bg-[#F9A825] hover:bg-amber-600 text-white text-xs font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50">
                {isProcessing ? 'Updating...' : <><CheckCircle2 size={14} /> Update Role</>}
              </button>
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
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-black text-gray-900 tracking-tight">Remove User Account?</h3>
            <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed">
              Are you sure you want to remove <strong>{deleteModalUser.name}</strong> from the system? They will be moved to the Trash Bin and lose all platform access immediately.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => setDeleteModalUser(null)} disabled={isProcessing} className="bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold py-3 rounded-xl border border-gray-100 transition-all cursor-pointer">
                Cancel
              </button>
              <button onClick={confirmDeleteUser} disabled={isProcessing} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-3 rounded-xl transition-all flex justify-center items-center shadow-sm cursor-pointer">
                {isProcessing ? 'Removing...' : 'Yes, Remove User'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagementPage;