// src/pages/dashboard/TrashBinPage.jsx
import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, ShieldAlert, CheckCircle, AlertCircle, RefreshCw, MessageSquare, Users, MapPin, FileCheck, X, AlertTriangle, ListChecks, Clock } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, orderBy, doc, setDoc, addDoc, deleteDoc, GeoPoint } from 'firebase/firestore';

const TrashBinPage = () => {
  const [trashList, setTrashList] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All'); 
  const [loadingItemId, setLoadingItemId] = useState(null);
  
  // Single Item Modals
  const [restoreModalItem, setRestoreModalItem] = useState(null);
  const [deleteModalItem, setDeleteModalItem] = useState(null);
  
  // BULK ACTION & SELECTION STATES
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [emptyTrashModal, setEmptyTrashModal] = useState(false);
  const [bulkRestoreModal, setBulkRestoreModal] = useState(false);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

  const [toast, setToast] = useState({ isOpen: false, type: 'success', message: '' });

  // 1. Data Streaming
  useEffect(() => {
    const qTrash = query(collection(db, "trash_bin"), orderBy("deletedAt", "desc"));
    const unsubscribe = onSnapshot(qTrash, (snap) => {
      const records = snap.docs.map(docSnap => {
        const data = docSnap.data();
        const deletedDate = data.deletedAt?.toDate() || new Date();
        const daysRemaining = Math.max(0, 30 - Math.floor((new Date() - deletedDate) / (1000 * 60 * 60 * 24)));

        return {
          id: docSnap.id,
          originalCollection: data.originalCollection,
          originalId: data.originalId || null, 
          deletedAt: deletedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          daysLeft: daysRemaining,
          itemMemoryData: data.itemMemoryData || {}
        };
      });
      setTrashList(records);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (toast.isOpen) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, isOpen: false })), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.isOpen]);

  // Filters
  const filteredTrash = trashList.filter(item => {
    if (activeCategory === 'All') return true;
    return item.originalCollection === activeCategory;
  });

  // Toggle single item selection
  const toggleSelection = (id) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]);
  };

  const handleSelectAll = () => setSelectedItems(filteredTrash.map(item => item.id));
  const handleDeselectAll = () => setSelectedItems([]);

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedItems([]); // Reset selection when exiting mode
  };

  // SINGLE RECORD ENGINE
  const executeRestore = async () => {
    if (!restoreModalItem || loadingItemId) return;
    setLoadingItemId(restoreModalItem.id);

    try {
      const targetCollection = restoreModalItem.originalCollection;
      let payloadToRestore = { ...restoreModalItem.itemMemoryData };

      // Reconstruct the Firestore GeoPoint object
      if (targetCollection === 'offices' && payloadToRestore.latitude !== undefined && payloadToRestore.longitude !== undefined) {
        payloadToRestore.location = new GeoPoint(Number(payloadToRestore.latitude), Number(payloadToRestore.longitude));
        delete payloadToRestore.latitude;
        delete payloadToRestore.longitude;
      }

      if (restoreModalItem.originalId) {
        await setDoc(doc(db, targetCollection, restoreModalItem.originalId), payloadToRestore);
      } else {
        await addDoc(collection(db, targetCollection), payloadToRestore);
      }
      
      await deleteDoc(doc(db, "trash_bin", restoreModalItem.id));
      setToast({ isOpen: true, type: 'success', message: 'Record successfully restored.' });
    } catch (err) {
      setToast({ isOpen: true, type: 'error', message: 'Recovery failure: ' + err.message });
    } finally {
      setLoadingItemId(null);
      setRestoreModalItem(null); 
    }
  };

  const executePermanentDelete = async () => {
    if (!deleteModalItem || loadingItemId) return;
    setLoadingItemId(deleteModalItem.id);
    try {
      await deleteDoc(doc(db, "trash_bin", deleteModalItem.id));
      setToast({ isOpen: true, type: 'success', message: 'Record permanently destroyed.' });
    } catch (err) {
      setToast({ isOpen: true, type: 'error', message: 'Deletion failure: ' + err.message });
    } finally {
      setLoadingItemId(null);
      setDeleteModalItem(null); 
    }
  };

  // BULK RECORD ENGINE (PROFESSIONAL MULTI-THREADING)
  const executeBulkRestore = async () => {
    setBulkProcessing(true);
    try {
      const itemsToRestore = trashList.filter(item => selectedItems.includes(item.id));
      
      await Promise.all(itemsToRestore.map(async (item) => {
        const targetCollection = item.originalCollection;
        let payloadToRestore = { ...item.itemMemoryData };

        if (targetCollection === 'offices' && payloadToRestore.latitude !== undefined && payloadToRestore.longitude !== undefined) {
          payloadToRestore.location = new GeoPoint(Number(payloadToRestore.latitude), Number(payloadToRestore.longitude));
          delete payloadToRestore.latitude; delete payloadToRestore.longitude;
        }

        if (item.originalId) {
          await setDoc(doc(db, targetCollection, item.originalId), payloadToRestore);
        } else {
          await addDoc(collection(db, targetCollection), payloadToRestore);
        }
        await deleteDoc(doc(db, "trash_bin", item.id));
      }));

      setToast({ isOpen: true, type: 'success', message: `${itemsToRestore.length} records successfully restored.` });
      setSelectedItems([]);
      setIsSelectionMode(false);
    } catch (err) {
      setToast({ isOpen: true, type: 'error', message: 'Bulk restore error: ' + err.message });
    } finally {
      setBulkProcessing(false);
      setBulkRestoreModal(false);
    }
  };

  const executeBulkDelete = async () => {
    setBulkProcessing(true);
    try {
      await Promise.all(selectedItems.map(id => deleteDoc(doc(db, "trash_bin", id))));
      setToast({ isOpen: true, type: 'success', message: `${selectedItems.length} records permanently destroyed.` });
      setSelectedItems([]);
      setIsSelectionMode(false);
    } catch (err) {
      setToast({ isOpen: true, type: 'error', message: 'Bulk delete error: ' + err.message });
    } finally {
      setBulkProcessing(false);
      setBulkDeleteModal(false);
    }
  };

  const executeEmptyTrash = async () => {
    setBulkProcessing(true);
    try {
      await Promise.all(trashList.map(item => deleteDoc(doc(db, "trash_bin", item.id))));
      setToast({ isOpen: true, type: 'success', message: `Trash bin completely emptied.` });
    } catch (err) {
      setToast({ isOpen: true, type: 'error', message: 'Failed to empty trash: ' + err.message });
    } finally {
      setBulkProcessing(false);
      setEmptyTrashModal(false);
      setSelectedItems([]);
      setIsSelectionMode(false);
    }
  };

  // UI HELPERS
  const getSourceIcon = (type) => {
    switch(type) {
      case 'company_news': return <MessageSquare size={14} className="text-amber-600" />;
      case 'users': return <Users size={14} className="text-blue-600" />;
      case 'offices': 
      case 'geofencing': return <MapPin size={14} className="text-emerald-600" />;
      case 'reports_archive': 
      case 'reports': return <FileCheck size={14} className="text-purple-600" />;
      case 'shifts': return <Clock size={14} className="text-indigo-600" />;
      default: return <FileCheck size={14} className="text-gray-600" />;
    }
  };

  const cleanLabelMap = {
    company_news: 'News Feed & Events',
    users: 'User Profiles & Roles',
    offices: 'Operational Locations', 
    geofencing: 'Operational Locations',
    reports_archive: 'System Log Reports',
    reports: 'System Log Reports',
    shifts: 'Shift Policies'
  };

  const extractFileName = (url) => {
    if (!url) return null;
    try {
      const decoded = decodeURIComponent(url);
      const nameWithQuery = decoded.split('/').pop();
      return nameWithQuery.split('?')[0]; 
    } catch { return url; }
  };

  return (
    <div className="p-6 md:p-8 w-full relative animate-in fade-in duration-300 box-border pb-24">
      
      {/* Top Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div onClick={() => {setActiveCategory('All'); setIsSelectionMode(false); setSelectedItems([]);}} className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer ${activeCategory === 'All' ? 'bg-amber-50/40 border-[#F9A825] ring-1 ring-[#F9A825]/20' : 'bg-white border-gray-100'}`}>
          <div><p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Archived Waste</p><h3 className="text-3xl font-black text-gray-900">{trashList.length}</h3><span className="text-[10px] text-gray-400 font-medium mt-1 block">Click to reset category views</span></div>
          <div className="p-3 bg-[#FFF4E5] rounded-xl text-[#F9A825]"><Trash2 size={22} /></div>
        </div>

        <div className=" p-6  flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Compliance Lifecycle Rule</p>
            <h3 className="text-base font-black text-gray-800 flex items-center gap-1.5 mt-1">30 Days Preservation Block</h3>
            <p className="text-[10px] text-gray-400 font-medium mt-1.5 leading-relaxed">Records are permanently purged from cloud databases automatically upon passing their 30-day storage expiration threshold.</p>
          </div>
          
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full relative">
        <div className="p-6 border-b border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center bg-[#FFF9F0]/30 gap-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Archived Vault Core Logs</h3>
            <p className="text-xs text-gray-400 mt-0.5">Filter items by category, review metrics data, and trigger real-time record recoveries.</p>
          </div>
          
          <div className="flex gap-2 items-center overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 custom-scrollbar min-w-0">
            {/* Action Bar Toggle */}
            <div className="flex gap-2 mr-4 pr-4 border-r border-gray-200">
              <button 
                onClick={toggleSelectionMode} 
                disabled={trashList.length === 0}
                className={`px-4 py-2 rounded-xl text-[11px] font-bold tracking-tight border transition-all flex items-center gap-1.5 disabled:opacity-50 outline-none cursor-pointer ${isSelectionMode ? 'bg-[#F9A825] text-white border-[#F9A825]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                <ListChecks size={14} /> {isSelectionMode ? 'Cancel Selection' : 'Select Items'}
              </button>
              
              <button 
                onClick={() => setEmptyTrashModal(true)} 
                disabled={trashList.length === 0}
                className="px-4 py-2 rounded-xl text-[11px] font-bold tracking-tight border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all flex items-center gap-1.5 disabled:opacity-50 outline-none cursor-pointer"
              >
                <Trash2 size={14} /> Empty Trash
              </button>
            </div>

            {/* Filters */}
            {[
              { id: 'All', label: 'All' }, 
              { id: 'company_news', label: 'News' },
              { id: 'offices', label: 'Locations' }, 
              { id: 'shifts', label: 'Shifts' }, 
              { id: 'reports_archive', label: 'Reports' } 
            ].map(chip => (
              <button
                key={chip.id} type="button" 
                onClick={() => {setActiveCategory(chip.id); setSelectedItems([]);}}
                className={`px-4 py-2 rounded-xl text-[11px] font-bold tracking-tight border transition-all cursor-pointer outline-none ${activeCategory === chip.id && !isSelectionMode ? 'bg-gray-800 text-white border-gray-800 shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* DYNAMIC BULK ACTION TOOLBAR */}
        {isSelectionMode && (
          <div className="bg-[#FFF4E5] border-b border-orange-100 p-3 px-6 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-4">
              <span className="text-xs font-black text-gray-800 bg-white px-3 py-1.5 rounded-lg border border-orange-100 shadow-sm">
                {selectedItems.length} Selected
              </span>
              <button onClick={handleSelectAll} className="text-xs font-bold text-[#F9A825] hover:text-orange-600 transition-colors outline-none cursor-pointer">Select All</button>
              <span className="text-gray-300">|</span>
              <button onClick={handleDeselectAll} className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors outline-none cursor-pointer">Deselect All</button>
            </div>
            
            <div className="flex gap-2">
              <button 
                disabled={selectedItems.length === 0} 
                onClick={() => setBulkRestoreModal(true)}
                className="px-4 py-2 rounded-xl text-[11px] font-bold tracking-tight border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all flex items-center gap-1.5 disabled:opacity-50 outline-none cursor-pointer"
              >
                <RotateCcw size={14} /> Restore Selected
              </button>
              <button 
                disabled={selectedItems.length === 0} 
                onClick={() => setBulkDeleteModal(true)}
                className="px-4 py-2 rounded-xl text-[11px] font-bold tracking-tight border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all flex items-center gap-1.5 disabled:opacity-50 outline-none cursor-pointer"
              >
                <Trash2 size={14} /> Delete Selected
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 tracking-wider bg-gray-50/50 uppercase">
                {isSelectionMode && <th className="p-4 pl-6 w-10 text-center"></th>}
                <th className={`p-4 ${!isSelectionMode ? 'pl-6' : 'pl-2'} w-1/3`}>Archived Item Record Heading / Title</th>
                <th className="p-4">Original Origin Module</th>
                <th className="p-4 text-center">Deletion Date</th>
                <th className="p-4 text-center">Retention Window</th>
                <th className="p-4 pr-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredTrash.map((item) => {
                const displayTitle = item.itemMemoryData.title || item.itemMemoryData.name || item.itemMemoryData.email || extractFileName(item.itemMemoryData.fileUrl) || item.itemMemoryData.reportName || 'Unnamed Record Block';
                const isSelected = selectedItems.includes(item.id);

                return (
                  <tr key={item.id} onClick={() => isSelectionMode && toggleSelection(item.id)} className={`transition-colors ${isSelectionMode ? 'cursor-pointer' : ''} ${isSelected ? 'bg-amber-50/30' : 'hover:bg-gray-50/40'}`}>
                    
                    {isSelectionMode && (
                      <td className="p-4 pl-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelection(item.id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#F9A825] focus:ring-[#F9A825] cursor-pointer" 
                        />
                      </td>
                    )}

                    <td className={`p-4 ${!isSelectionMode ? 'pl-6' : 'pl-2'}`}>
                      <h4 className="font-bold text-gray-800 line-clamp-1 leading-tight max-w-xs">{displayTitle}</h4>
                      <span className="text-[9px] font-mono font-medium text-gray-400 block mt-0.5">DOC_REF: {item.id}</span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                        {getSourceIcon(item.originalCollection)}
                        <span>{cleanLabelMap[item.originalCollection] || item.originalCollection}</span>
                      </div>
                    </td>

                    <td className="p-4 text-center text-xs font-bold text-gray-500 font-mono">{item.deletedAt}</td>

                    <td className="p-4 text-center">
                      <span className={`text-[10px] font-black px-2.5 py-1 border rounded-md font-mono ${item.daysLeft <= 5 ? 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                        ⏳ {item.daysLeft} Days Left
                      </span>
                    </td>

                    <td className="p-4 pr-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button type="button" disabled={isSelectionMode || loadingItemId === item.id} onClick={(e) => { e.stopPropagation(); setRestoreModalItem(item); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 outline-none cursor-pointer">
                          <RotateCcw size={12} /> Restore
                        </button>
                        <button type="button" disabled={isSelectionMode || loadingItemId === item.id} onClick={(e) => { e.stopPropagation(); setDeleteModalItem(item); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 outline-none cursor-pointer">
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredTrash.length === 0 && <p className="text-xs text-gray-400 text-center py-16 font-medium">No matching archived records found inside this log tier.</p>}
        </div>
      </div>

      {/* SINGLE ITEM MODALS */}
      {restoreModalItem && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[999999] p-4 pointer-events-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 text-center shadow-2xl border border-gray-50 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><RotateCcw size={24} /></div>
            <h3 className="text-base font-black text-gray-800 tracking-tight">Confirm Restoration</h3>
            <p className="text-xs text-gray-400 font-medium mt-2 leading-relaxed">Are you sure you want to pull this record from the Trash Bin and restore it to its original <strong>{cleanLabelMap[restoreModalItem.originalCollection]}</strong> database module?</p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={() => setRestoreModalItem(null)} disabled={loadingItemId !== null} className="bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold py-3 rounded-xl border border-gray-100 outline-none transition-all cursor-pointer">Cancel</button>
              <button onClick={executeRestore} disabled={loadingItemId !== null} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl border-0 outline-none transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer">
                {loadingItemId === restoreModalItem.id ? <RefreshCw size={14} className="animate-spin" /> : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalItem && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[999999] p-4 pointer-events-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 text-center shadow-2xl border border-gray-50 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} /></div>
            <h3 className="text-base font-black text-gray-800 tracking-tight">Permanent Destruction</h3>
            <p className="text-xs text-gray-400 font-medium mt-2 leading-relaxed">Are you sure you want to permanently delete this record right now? This action bypasses the 30-day lifecycle rule and <strong>cannot be undone</strong>.</p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={() => setDeleteModalItem(null)} disabled={loadingItemId !== null} className="bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold py-3 rounded-xl border border-gray-100 outline-none transition-all cursor-pointer">Cancel</button>
              <button onClick={executePermanentDelete} disabled={loadingItemId !== null} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-3 rounded-xl border-0 outline-none transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer">
                {loadingItemId === deleteModalItem.id ? <RefreshCw size={14} className="animate-spin" /> : 'Destroy Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK ACTION MODALS */}
      {bulkRestoreModal && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[999999] p-4 pointer-events-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 text-center shadow-2xl border border-gray-50 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><RotateCcw size={24} /></div>
            <h3 className="text-base font-black text-gray-800 tracking-tight">Bulk Restoration</h3>
            <p className="text-xs text-gray-400 font-medium mt-2 leading-relaxed">You are about to restore <strong>{selectedItems.length} records</strong> back to the live database grids. Proceed?</p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={() => setBulkRestoreModal(false)} disabled={bulkProcessing} className="bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold py-3 rounded-xl border border-gray-100 outline-none transition-all cursor-pointer">Cancel</button>
              <button onClick={executeBulkRestore} disabled={bulkProcessing} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl border-0 outline-none transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer">
                {bulkProcessing ? <RefreshCw size={14} className="animate-spin" /> : 'Restore All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteModal && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[999999] p-4 pointer-events-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 text-center shadow-2xl border border-gray-50 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} /></div>
            <h3 className="text-base font-black text-gray-800 tracking-tight">Bulk Destruction</h3>
            <p className="text-xs text-gray-400 font-medium mt-2 leading-relaxed">You are about to permanently eradicate <strong>{selectedItems.length} records</strong>. This cannot be undone.</p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={() => setBulkDeleteModal(false)} disabled={bulkProcessing} className="bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold py-3 rounded-xl border border-gray-100 outline-none transition-all cursor-pointer">Cancel</button>
              <button onClick={executeBulkDelete} disabled={bulkProcessing} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-3 rounded-xl border-0 outline-none transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer">
                {bulkProcessing ? <RefreshCw size={14} className="animate-spin" /> : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {emptyTrashModal && (
        <div className="fixed inset-0 w-screen h-screen bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[999999] p-4 pointer-events-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 text-center shadow-2xl border border-gray-50 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 size={24} /></div>
            <h3 className="text-base font-black text-gray-800 tracking-tight text-red-600">Empty Entire Trash Bin?</h3>
            <p className="text-xs text-gray-400 font-medium mt-2 leading-relaxed">Warning: You are about to permanently delete all <strong>{trashList.length}</strong> archived records. This action is absolute and irreversible.</p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={() => setEmptyTrashModal(false)} disabled={bulkProcessing} className="bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold py-3 rounded-xl border border-gray-100 outline-none transition-all cursor-pointer">Cancel</button>
              <button onClick={executeEmptyTrash} disabled={bulkProcessing} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 rounded-xl border-0 outline-none transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer">
                {bulkProcessing ? <RefreshCw size={14} className="animate-spin" /> : 'Eradicate Everything'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST SYSTEM */}
      {toast.isOpen && (
        <div className="fixed bottom-6 right-6 z-[1000000] flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-200 min-w-[280px]">
          {toast.type === 'success' ? <CheckCircle className="text-emerald-400 flex-shrink-0" size={18} /> : <AlertCircle className="text-rose-400 flex-shrink-0" size={18} />}
          <span className="text-xs font-semibold tracking-tight">{toast.message}</span>
          <button type="button" onClick={() => setToast(prev => ({ ...prev, isOpen: false }))} className="ml-auto text-gray-400 hover:text-white transition-colors bg-transparent border-0 outline-none cursor-pointer"><X size={14} /></button>
        </div>
      )}
    </div>
  );
};

export default TrashBinPage;