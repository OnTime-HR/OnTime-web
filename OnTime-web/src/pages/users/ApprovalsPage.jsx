// src/pages/users/ApprovalsPage.jsx
import React, { useState, useEffect } from 'react';
import { Hourglass, CheckCircle, DollarSign, Download, FileText, FileSpreadsheet, History, Search, Trash2, AlertTriangle, X } from 'lucide-react';
import { updateRequestStatus } from '../../services/approvalService';
import { generateAndArchiveReport, downloadArchivedFile, deleteArchivedRecord } from '../../services/reportService';
import { db } from '../../services/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

const ApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState('All Requests');
  const [requestStatusView, setRequestStatusView] = useState('Pending');
  const [allRequests, setAllRequests] = useState([]);
  const [archiveLogs, setArchiveLogs] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [compiling, setCompiling] = useState(false);
  
  const [selectedReport, setSelectedReport] = useState('Leave');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, logId: null });

  // MODAL & DECISION STATES
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalStep, setModalStep] = useState('details'); 
  const [actionReason, setActionReason] = useState(''); 
  const [pendingDecision, setPendingDecision] = useState(null); 

  // LIVE METRIC STATES
  const [metrics, setMetrics] = useState({
    pendingCount: 0,
    approvalsThisMonth: 0,
    totalClaimsValue: 0
  });

  useEffect(() => {
    const requestsRef = collection(db, "leave_requests");
    
    const unsubscribeRequests = onSnapshot(requestsRef, (snapshot) => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      let pending = 0;
      let approvedThisMonth = 0;
      let totalValue = 0;

      const formatted = snapshot.docs.map(docSnap => {
        const item = docSnap.data();
        const appliedDate = item.appliedAt?.toDate() || new Date();
        
        if (item.status === 'Pending') pending++;
        if (item.status === 'Approved' && appliedDate.getMonth() === currentMonth && appliedDate.getFullYear() === currentYear) approvedThisMonth++;
        if (item.status === 'Approved') totalValue += Number(item.claimAmount || item.amount || (item.totalDays * 150) || 0);

        return {
          id: docSnap.id,
          employeeId: item.userId || '', 
          employeeName: item.userName || 'Unknown Staff',
          role: item.userRole || 'Employee',
          type: item.leaveType || 'Leave',
          dateRequested: appliedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          duration: item.totalDays || 1,
          status: item.status || 'Pending',
          reason: item.reason || 'No additional details provided by the employee.',
          reviewedBy: item.reviewedBy || null,
          actionReason: item.actionReason || item.rejectionReason || null,
          decisionHistory: item.decisionHistory || [] 
        };
      });

      setMetrics({ pendingCount: pending, approvalsThisMonth: approvedThisMonth, totalClaimsValue: totalValue });
      setAllRequests(formatted);
    });

    const archiveQuery = query(collection(db, "reports_archive"));
    const unsubscribeArchive = onSnapshot(archiveQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateFormatted: doc.data().downloadedAt?.toDate().toLocaleString() || 'Just Now'
      }));
      setArchiveLogs(logs.sort((a, b) => (b.downloadedAt?.toDate() || new Date(0)) - (a.downloadedAt?.toDate() || new Date(0))));
    });

    return () => {
      unsubscribeRequests();
      unsubscribeArchive();
    };
  }, []);

  const currentViewRequests = allRequests.filter(req => req.status === requestStatusView);
  const filteredRequests = currentViewRequests.filter(req => {
    if (activeTab === 'All Requests') return true;
    const requestType = req.type ? req.type.toLowerCase().trim() : '';
    const currentTab = activeTab.toLowerCase().trim();
    return requestType === currentTab || requestType.includes(currentTab) || currentTab.includes(requestType);
  });

  const filteredArchiveLogs = archiveLogs.filter(log => 
    log.fileUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.reportName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.format.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCompileReport = async () => {
    setCompiling(true);
    try { await generateAndArchiveReport(selectedReport, exportFormat); } 
    catch (err) { alert("Database Query Failure: " + err.message); } 
    finally { setCompiling(false); }
  };

  const openConfirmDelete = (logId) => setDeleteModal({ isOpen: true, logId: logId });
  const closeConfirmDelete = () => setDeleteModal({ isOpen: false, logId: null });
  const handleArchiveDeleteExecute = async () => {
    if (!deleteModal.logId) return;
    try { await deleteArchivedRecord(deleteModal.logId); closeConfirmDelete(); } 
    catch (err) { alert("Deletion Failure: " + err.message); }
  };

  const openDetailsModal = (req) => {
    setSelectedRequest(req);
    setModalStep('details');
    setActionReason('');
    setPendingDecision(null);
  };

  const closeDetailsModal = () => {
    setSelectedRequest(null);
    setTimeout(() => setModalStep('details'), 200); 
  };

  const proceedWithAction = () => {
    if ((modalStep === 'reason_input') && !actionReason.trim()) {
      alert("Please provide a reason for this decision.");
      return;
    }
    setModalStep('confirm');
  };

  const executeFinalDecision = async () => {
    setLoadingId(selectedRequest.id);
    try {
      await updateRequestStatus(
        selectedRequest.id, 
        selectedRequest.employeeId, 
        selectedRequest.type, 
        selectedRequest.duration, 
        pendingDecision,
        actionReason,
        selectedRequest.status 
      );
      closeDetailsModal();
    } catch (error) {
      alert("Error processing transaction request: " + error.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="p-10 relative">
      {/* METRICS ROW */}
      <div className="grid grid-cols-3 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Pending Requests</p>
            <h3 className="text-3xl font-bold text-gray-900">{metrics.pendingCount}</h3>
          </div>
          <div className="p-3 bg-[#FFF4E5] rounded-xl text-[#F9A825]"><Hourglass size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Approvals This Month</p>
            <h3 className="text-3xl font-bold text-gray-900">{metrics.approvalsThisMonth}</h3>
          </div>
          <div className="p-3 bg-green-50 rounded-xl text-green-600"><CheckCircle size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Claims Value</p>
            <h3 className="text-3xl font-bold text-gray-900">${metrics.totalClaimsValue.toLocaleString('en-US', { minimumFractionDigits: 0 })}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><DollarSign size={24} /></div>
        </div>
      </div>

      {/* EVALUATION TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-[#FFF9F0]/30">
          <div className="flex items-center gap-6">
            <h3 className="font-bold text-gray-900 text-base min-w-[140px]">{requestStatusView} Requests</h3>
            <div className="flex bg-gray-100/70 p-1 rounded-xl border border-gray-200/50">
              {['Pending', 'Approved', 'Rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setRequestStatusView(status)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    requestStatusView === status 
                      ? status === 'Approved' ? 'bg-green-500 text-white shadow-sm' 
                      : status === 'Rejected' ? 'bg-red-500 text-white shadow-sm' 
                      : 'bg-[#F9A825] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className="flex bg-gray-100/70 p-1 rounded-xl border border-gray-200/50">
            {['All Requests', 'Leave', 'Medical', 'Expense'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab ? 'bg-white text-gray-800 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'
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
                <th className="p-4 pr-6">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredRequests.map((req) => (
                <tr key={req.id} onClick={() => openDetailsModal(req)} className="hover:bg-gray-50/80 transition-colors cursor-pointer group">
                  <td className="p-4 pl-6 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      requestStatusView === 'Approved' ? 'bg-green-100 text-green-600' : requestStatusView === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-[#F9A825]'
                    }`}>
                      {req.employeeName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 leading-tight group-hover:text-[#F9A825] transition-colors">{req.employeeName}</h4>
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
                  <td className="p-4 pr-6 text-gray-700 font-semibold">{req.duration} Day(s)</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRequests.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">No {requestStatusView.toLowerCase()} requests found in this category.</p>
          )}
        </div>
      </div>

      {/* BOTTOM CONTROL GRID HUBS */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[380px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-base font-bold text-[#F9A825] mb-4">
              <FileText size={18} /> Report Generator
            </div>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">Compile verified database metrics straight from your live production Firestore architecture collections.</p>
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Data Metric Domain</label>
              <select value={selectedReport} onChange={(e) => setSelectedReport(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold p-3 rounded-xl outline-none focus:border-[#F9A825] transition-colors cursor-pointer">
                <option value="Leave">Leave Applications Archive</option>
                <option value="Attendance">Real-Time Attendance Logs</option>
                <option value="Employee">Staff Authorization Roster</option>
                <option value="Payroll">Calculated Compensation Metrics</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Output Target Format</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setExportFormat('pdf')} className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${exportFormat === 'pdf' ? 'border-[#F9A825] bg-amber-50/40 text-[#F9A825]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}><FileText size={14} /> PDF Document</button>
                <button type="button" onClick={() => setExportFormat('excel')} className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${exportFormat === 'excel' ? 'border-green-600 bg-green-50/40 text-green-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}><FileSpreadsheet size={14} /> Excel Sheet</button>
              </div>
            </div>
          </div>
          <button disabled={compiling} onClick={handleCompileReport} className="w-full bg-[#F9A825] text-white text-xs font-bold py-3.5 rounded-xl shadow-md hover:bg-amber-600 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50">
            <Download size={14} /> {compiling ? 'Compiling Live System Data...' : 'Compile & Download Document'}
          </button>
        </div>

        <div className="col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[380px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 text-base font-bold text-gray-800"><History size={18} className="text-gray-400" /> Generated Reports Archive</div>
            <div className="relative flex items-center w-full sm:w-64">
              <Search className="absolute left-3 text-gray-400" size={14} />
              <input type="text" placeholder="Search generated files..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 text-xs font-semibold rounded-xl outline-none focus:border-[#F9A825] tracking-wide transition-colors" />
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
                  <button onClick={() => downloadArchivedFile(log)} className="p-2 text-gray-400 hover:text-[#F9A825] hover:bg-amber-50 rounded-lg transition-colors" title="Download Copy"><Download size={15} /></button>
                  <button onClick={() => openConfirmDelete(log.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Log"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
            {filteredArchiveLogs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                <p className="text-xs text-gray-400 font-medium">No matching generated archive files found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DELETION CONFIRMATION MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-[#F9A825] mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h4 className="text-base font-bold text-gray-900 mb-1">Confirm Permanent Deletion</h4>
            <p className="text-xs text-gray-400 leading-relaxed px-2 mb-6">
              Are you sure you want to permanently delete this report log? This action will remove the record data from your workspace archive tracking dashboard layout.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={closeConfirmDelete} className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 text-xs font-bold py-3 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleArchiveDeleteExecute} className="w-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-3 rounded-xl shadow-sm transition-all">
                Delete Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC REQUEST DETAILS & DECISION MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Request Details</h3>
                <p className="text-xs text-gray-400">Review request information</p>
              </div>
              <button onClick={closeDetailsModal} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><X size={18} /></button>
            </div>

            {/* STEP 1: Details View */}
            {modalStep === 'details' && (
              <>
                <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-4">
                  <div className="flex justify-between border-b border-gray-200 pb-3">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Applicant</span>
                    <span className="text-sm font-bold text-gray-900">{selectedRequest.employeeName}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-3">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Type</span>
                    <span className="text-sm font-bold text-[#F9A825]">{selectedRequest.type}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-3">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Duration</span>
                    <span className="text-sm font-bold text-gray-900">{selectedRequest.duration} Day(s)</span>
                  </div>
                  <div className={`flex justify-between ${selectedRequest.status !== 'Pending' && selectedRequest.reviewedBy ? 'border-b border-gray-200 pb-3' : ''}`}>
                    <span className="text-xs text-gray-500 font-semibold uppercase">Date Requested</span>
                    <span className="text-sm font-bold text-gray-900">{selectedRequest.dateRequested}</span>
                  </div>

                  {/* RESTORED: Shows who reviewed it without needing the bulky timeline */}
                  {selectedRequest.status !== 'Pending' && selectedRequest.reviewedBy && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500 font-semibold uppercase">Reviewed By</span>
                      <span className="text-sm font-bold text-gray-900">{selectedRequest.reviewedBy}</span>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <h4 className="text-xs text-gray-500 font-semibold uppercase mb-2">Employee Reason / Notes</h4>
                  <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-xl p-3 leading-relaxed">
                    {selectedRequest.reason}
                  </p>
                </div>

                {/* --- NEW: CONDITIONAL DECISION HISTORY TIMELINE --- */}
                {selectedRequest.decisionHistory && selectedRequest.decisionHistory.length > 0 && 
                 !(selectedRequest.decisionHistory.length === 1 && selectedRequest.decisionHistory[0].action === 'Approved' && selectedRequest.decisionHistory[0].reason === 'No reason provided') ? (
                  <div className="mb-6">
                    <h4 className="text-xs text-gray-500 font-semibold uppercase mb-3">Audit Trail / Decision History</h4>
                    <div className="space-y-3 pl-2 border-l-2 border-gray-100 ml-2">
                      {selectedRequest.decisionHistory.map((log, index) => (
                        <div key={index} className="relative pl-4">
                          <div className={`absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                            log.action === 'Approved' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-[10px] font-bold uppercase ${
                                log.action === 'Approved' ? 'text-green-600' : 'text-red-500'
                              }`}>
                                {log.action}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {new Date(log.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            {log.reason !== "No reason provided" && (
                              <p className="text-xs text-gray-600 mt-1">
                                <span className="font-bold text-gray-800">{log.reviewer}:</span> {log.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Fallback for older database requests before we added the timeline feature
                  selectedRequest.status !== 'Pending' && selectedRequest.actionReason && (
                    <div className="mb-6">
                      <h4 className="text-xs text-gray-500 font-semibold uppercase mb-2">Previous Decision Note</h4>
                      <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 leading-relaxed font-medium">
                        <span className="font-bold text-gray-900">{selectedRequest.reviewedBy}: </span>
                        {selectedRequest.actionReason}
                      </p>
                    </div>
                  )
                )}
                {/* --- END DECISION HISTORY --- */}

                {/* DYNAMIC FOOTER: Allows decisions OR changing existing decisions */}
                {selectedRequest.status === 'Pending' ? (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <button onClick={() => { setPendingDecision('Rejected'); setModalStep('reason_input'); }} className="w-full bg-white border border-red-200 text-red-500 hover:bg-red-50 text-xs font-bold py-3 rounded-xl transition-colors">
                      Reject Request
                    </button>
                    <button onClick={() => { setPendingDecision('Approved'); setModalStep('confirm'); }} className="w-full bg-[#F9A825] hover:bg-amber-600 text-white text-xs font-bold py-3 rounded-xl shadow-sm transition-all">
                      Approve Request
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-[11px] text-gray-400 font-semibold mb-3 text-center uppercase tracking-wide">Need to change this decision?</p>
                    {selectedRequest.status === 'Approved' ? (
                      <button onClick={() => { setPendingDecision('Rejected'); setModalStep('reason_input'); }} className="w-full bg-white border border-red-200 text-red-500 hover:bg-red-50 text-xs font-bold py-3 rounded-xl transition-colors">
                        Revoke & Change to Rejected
                      </button>
                    ) : (
                      <button onClick={() => { setPendingDecision('Approved'); setModalStep('reason_input'); }} className="w-full bg-white border border-green-200 text-green-600 hover:bg-green-50 text-xs font-bold py-3 rounded-xl transition-colors">
                        Override & Change to Approved
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* STEP 2: Reason Input */}
            {modalStep === 'reason_input' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    {selectedRequest.status !== 'Pending' ? 'Reason for Decision Change' : 'Reason for Rejection'}
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Please provide a reason. This will be visible to the employee and saved to the audit trail.</p>
                  <textarea
                    autoFocus
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Type reason here..."
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 min-h-[120px] resize-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setModalStep('details')} className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 text-xs font-bold py-3 rounded-xl transition-colors">
                    Back
                  </button>
                  <button onClick={proceedWithAction} className="w-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-3 rounded-xl shadow-sm transition-all">
                    Proceed
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Final Confirmation */}
            {modalStep === 'confirm' && (
              <div className="text-center animate-in fade-in slide-in-from-right-4 duration-200 py-4">
                <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4 ${
                  pendingDecision === 'Approved' ? 'bg-amber-50 text-[#F9A825]' : 'bg-red-50 text-red-500'
                }`}>
                  <AlertTriangle size={28} />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Confirm {pendingDecision}</h4>
                <p className="text-sm text-gray-500 mb-8 px-4 leading-relaxed">
                  Are you sure you want to officially <span className="font-bold text-gray-700">{pendingDecision?.toLowerCase()}</span> this request for {selectedRequest?.employeeName}? 
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    disabled={loadingId !== null}
                    onClick={() => setModalStep('details')} 
                    className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 text-xs font-bold py-3 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={loadingId !== null}
                    onClick={executeFinalDecision} 
                    className={`w-full text-white text-xs font-bold py-3 rounded-xl shadow-sm transition-all flex items-center justify-center ${
                      pendingDecision === 'Approved' ? 'bg-[#F9A825] hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {loadingId ? 'Processing...' : `Yes, ${pendingDecision}`}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsPage;