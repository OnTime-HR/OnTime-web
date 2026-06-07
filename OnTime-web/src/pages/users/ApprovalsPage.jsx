// src/pages/users/ApprovalsPage.jsx
import React, { useState, useEffect } from 'react';
// Added AlertTriangle to handle the custom warning icon layout display
import { Hourglass, CheckCircle, DollarSign, Download, FileText, FileSpreadsheet, History, Search, Trash2, AlertTriangle } from 'lucide-react';
import { streamPendingRequests, updateRequestStatus } from '../../services/approvalService';
import { generateAndArchiveReport, downloadArchivedFile, deleteArchivedRecord } from '../../services/reportService';
import { db } from '../../services/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const ApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState('All Requests');
  const [allRequests, setAllRequests] = useState([]);
  const [archiveLogs, setArchiveLogs] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [compiling, setCompiling] = useState(false);
  
  // Interactive operational state parameters
  const [selectedReport, setSelectedReport] = useState('Leave');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [searchQuery, setSearchQuery] = useState('');

  // CUSTOM MODAL STATES: Tracks if the custom alert is open, and which log ID it points to
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, logId: null });

  // 1. Hook up the live Firestore system streams
  useEffect(() => {
    const unsubscribeRequests = streamPendingRequests((firebaseData) => {
      const formatted = firebaseData.map(item => ({
        id: item.id,
        employeeId: item.userId || '', 
        employeeName: item.userName || 'Unknown Staff',
        role: item.userRole || 'Employee',
        type: item.leaveType || 'Leave',
        dateRequested: item.appliedAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Recent',
        duration: item.totalDays || 1,
        status: item.status || 'Pending'
      }));
      setAllRequests(formatted);
    });

    const archiveQuery = query(collection(db, "reports_archive"), orderBy("downloadedAt", "desc"));
    const unsubscribeArchive = onSnapshot(archiveQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateFormatted: doc.data().downloadedAt?.toDate().toLocaleString() || 'Just Now'
      }));
      setArchiveLogs(logs);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeArchive();
    };
  }, []);

  const handleCompileReport = async () => {
    setCompiling(true);
    try {
      await generateAndArchiveReport(selectedReport, exportFormat);
    } catch (err) {
      alert("Database Query Failure: " + err.message);
    } finally {
      setCompiling(false);
    }
  };

  // Triggers the custom modal state instead of using native window prompts
  const openConfirmDelete = (logId) => {
    setDeleteModal({ isOpen: true, logId: logId });
  };

  const closeConfirmDelete = () => {
    setDeleteModal({ isOpen: false, logId: null });
  };

  const handleArchiveDeleteExecute = async () => {
    if (!deleteModal.logId) return;
    
    try {
      await deleteArchivedRecord(deleteModal.logId);
      closeConfirmDelete(); // Closes the modal smoothly on success
    } catch (err) {
      alert("Deletion Failure: " + err.message);
    }
  };

  const handleDecision = async (request, decision) => {
    setLoadingId(request.id);
    try {
      await updateRequestStatus(request.id, request.employeeId, request.type, request.duration, decision);
      alert(`Request has been successfully ${decision.toLowerCase()}!`);
    } catch (error) {
      alert("Error processing transaction request: " + error.message);
    } finally {
      setLoadingId(null);
    }
  };

  const filteredRequests = allRequests.filter(req => {
    if (activeTab === 'All Requests') return true;
    return req.type.toLowerCase() === activeTab.toLowerCase();
  });

  const filteredArchiveLogs = archiveLogs.filter(log => 
    log.fileUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.reportName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.format.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-10 relative">
      {/* METRICS ROW */}
      <div className="grid grid-cols-3 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Pending Requests</p>
            <h3 className="text-3xl font-bold text-gray-900">{allRequests.length}</h3>
          </div>
          <div className="p-3 bg-[#FFF4E5] rounded-xl text-[#F9A825]">
            <Hourglass size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Approvals This Month</p>
            <h3 className="text-3xl font-bold text-gray-900">48</h3>
          </div>
          <div className="p-3 bg-green-50 rounded-xl text-green-600">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Claims Value</p>
            <h3 className="text-3xl font-bold text-gray-900">$4,250</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* EVALUATION TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#FFF9F0]/30">
          <h3 className="font-bold text-gray-900 text-base">Pending Approvals</h3>
          <div className="flex bg-gray-100/70 p-1 rounded-xl border border-gray-200/50">
            {['All Requests', 'Leave', 'Medical', 'Expense'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab ? 'bg-[#F9A825] text-white shadow-sm' : 'text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 bg-gray-50/50 uppercase">
                <th className="p-4 pl-6">Employee</th>
                <th className="p-4">Type</th>
                <th className="p-4">Date Requested</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="p-4 pl-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-xs text-[#F9A825]">
                      {req.employeeName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 leading-tight">{req.employeeName}</h4>
                      <p className="text-gray-400 text-[11px] font-medium">{req.role}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md uppercase ${
                      req.type === 'Medical' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {req.type}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{req.dateRequested}</td>
                  <td className="p-4 text-gray-700 font-semibold">{req.duration} Day(s)</td>
                  <td className="p-4">
                    <span className="flex items-center gap-1.5 text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-center space-x-2">
                    <button 
                      disabled={loadingId !== null}
                      onClick={() => handleDecision(req, 'Approved')}
                      className="bg-[#F9A825] text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button 
                      disabled={loadingId !== null}
                      onClick={() => handleDecision(req, 'Rejected')}
                      className="border border-gray-200 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOTTOM CONTROL GRID HUBS */}
      <div className="grid grid-cols-12 gap-8">
        {/* REPORT GENERATOR PANEL */}
        <div className="col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[380px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-base font-bold text-[#F9A825] mb-4">
              <FileText size={18} /> Report Generator
            </div>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Compile verified database metrics straight from your live production Firestore architecture collections.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Data Metric Domain</label>
              <select 
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold p-3 rounded-xl outline-none focus:border-[#F9A825] transition-colors cursor-pointer"
              >
                <option value="Leave">Leave Applications Archive</option>
                <option value="Attendance">Real-Time Attendance Logs</option>
                <option value="Employee">Staff Authorization Roster</option>
                <option value="Payroll">Calculated Compensation Metrics</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Output Target Format</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat('pdf')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    exportFormat === 'pdf' ? 'border-[#F9A825] bg-amber-50/40 text-[#F9A825]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <FileText size={14} /> PDF Document
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('excel')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    exportFormat === 'excel' ? 'border-green-600 bg-green-50/40 text-green-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <FileSpreadsheet size={14} /> Excel Sheet
                </button>
              </div>
            </div>
          </div>

          <button
            disabled={compiling}
            onClick={handleCompileReport}
            className="w-full bg-[#F9A825] text-white text-xs font-bold py-3.5 rounded-xl shadow-md hover:bg-amber-600 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            <Download size={14} /> {compiling ? 'Compiling Live System Data...' : 'Compile & Download Document'}
          </button>
        </div>

        {/* REPOSTS ARCHIVE CONTAINER BOX */}
        <div className="col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[380px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 text-base font-bold text-gray-800">
              <History size={18} className="text-gray-400" /> Generated Reports Archive
            </div>
            
            <div className="relative flex items-center w-full sm:w-64">
              <Search className="absolute left-3 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search generated files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 text-xs font-semibold rounded-xl outline-none focus:border-[#F9A825] tracking-wide transition-colors"
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 pr-1 space-y-3 custom-scrollbar">
            {filteredArchiveLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between border border-gray-100 p-3 rounded-xl hover:bg-gray-50/40 transition-all group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${log.format === 'PDF' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                    {log.format === 'PDF' ? <FileText size={18} /> : <FileSpreadsheet size={18} />}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-700">{log.fileUrl}</h5>
                    <p className="text-[10px] text-gray-400 font-medium">{log.dateFormatted} • System Admin Run</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadArchivedFile(log)}
                    className="p-2 text-gray-400 hover:text-[#F9A825] hover:bg-amber-50 rounded-lg transition-colors"
                    title="Download Copy"
                  >
                    <Download size={15} />
                  </button>
                  <button
                    onClick={() => openConfirmDelete(log.id)} // CHANGED: Calls our custom modal gate state
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Log"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BRAND ALIGNED PREMIUM CONFIRMATION MODAL CARD POPUP */}
      {/* ========================================================= */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            
            {/* Minimalist Signature Gold Accent Icon Circle */}
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-[#F9A825] mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>

            {/* Warning Message Typography Layout */}
            <h4 className="text-base font-bold text-gray-900 mb-1">Confirm Permanent Deletion</h4>
            <p className="text-xs text-gray-400 leading-relaxed px-2 mb-6">
              Are you sure you want to permanently delete this report log? This action will remove the record data from your workspace archive tracking dashboard layout.
            </p>

            {/* Grid Action Controls Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeConfirmDelete}
                className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 text-xs font-bold py-3 rounded-xl transition-colors"
              >
                Cancel, Keep Record
              </button>
              <button
                type="button"
                onClick={handleArchiveDeleteExecute}
                className="w-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-3 rounded-xl shadow-sm transition-all"
              >
                Yes, Delete Log
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsPage;