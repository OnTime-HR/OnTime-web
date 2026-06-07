// src/services/reportService.js
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Fetches dynamic, real-time records straight from respective Firestore collections
 */
const fetchFirestoreData = async (domain) => {
  let collectionName = '';
  switch (domain) {
    case 'Employee': collectionName = 'users'; break;
    case 'Attendance': collectionName = 'attendance'; break;
    case 'Leave': collectionName = 'leave_requests'; break;
    case 'Payroll': collectionName = 'payroll'; break;
    default: throw new Error("Unknown data domain context.");
  }

  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Compiles real database logs, triggers downloads, and logs history to the archive.
 */
// src/services/reportService.js

/**
 * Compiles real database logs, triggers downloads, and logs history to the archive conditionally.
 * @param {string} reportType - 'Employee' | 'Attendance' | 'Leave' | 'Payroll'
 * @param {string} format - 'pdf' | 'excel'
 * @param {boolean} shouldArchive - If true, provisions a new database record document entry
 */
export const generateAndArchiveReport = async (reportType, format, shouldArchive = true) => {
  // 1. Fetch live metrics from the respective Firestore collections
  const rawData = await fetchFirestoreData(reportType);

  if (!rawData || rawData.length === 0) {
    throw new Error(`No live records found inside the '${reportType}' database collection to compile.`);
  }

  let headers = [];
  let rows = [];
  const timestampString = new Date().toISOString().split('T')[0];
  const fileName = `${reportType}_Report_${timestampString}`;

  // 2. Map structural document fields explicitly based on collection schemas
  switch (reportType) {
    case 'Employee':
      headers = [['Employee ID', 'Full Name', 'Role/Designation', 'Company Code', 'Status']];
      rows = rawData.map(emp => [emp.id.substring(0, 8), emp.name || emp.userName || 'Unknown Staff', emp.role || 'Employee', emp.company_code || 'COM100', emp.status || 'Active']);
      break;
    case 'Attendance':
      headers = [['Date', 'Employee Name', 'Check In', 'Check Out', 'Location Status']];
      rows = rawData.map(att => [att.date || timestampString, att.userName || 'Staff Member', att.checkIn || '--', att.checkOut || '--', att.status || 'Verified']);
      break;
    case 'Leave':
      headers = [['Employee Name', 'Category Type', 'Duration', 'Approval Status']];
      rows = rawData.map(leave => [leave.userName || 'Unknown Staff', leave.leaveType || 'Leave', `${leave.totalDays || 1} Day(s)`, leave.status || 'Pending']);
      break;
    case 'Payroll':
      headers = [['Employee ID', 'Employee Name', 'Basic Salary', 'Allowances', 'Deductions', 'Net Pay']];
      rows = rawData.map(p => [p.userId || 'N/A', p.userName || 'Staff', `$${p.basicSalary || '0'}`, `$${p.allowances || '0'}`, `$${p.deductions || '0'}`, `$${p.netPay || '0'}`]);
      break;
    default:
      return;
  }

  // 3. EXECUTE EXCEL EXPORT WORKFLOW
  if (format === 'excel') {
    const worksheetData = [headers[0], ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Logs');
    worksheet['!cols'] = Array(headers[0].length).fill({ wch: 22 });
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } 
  
  // 4. EXECUTE PDF EXPORT WORKFLOW 
  else if (format === 'pdf') {
    const docInstance = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    docInstance.setFillColor(249, 168, 37);
    docInstance.rect(0, 0, 210, 8, 'F');

    docInstance.setFont("Helvetica", "bold");
    docInstance.setFontSize(20);
    docInstance.setTextColor(17, 24, 39);
    docInstance.text(`OnTime Corporate Portal`, 15, 22);

    docInstance.setFontSize(11);
    docInstance.setFont("Helvetica", "normal");
    docInstance.setTextColor(107, 114, 128);
    docInstance.text(`System Data Analytics: Administrative ${reportType} Log Sheet`, 15, 28);
    docInstance.text(`Generated: ${new Date().toLocaleString()}`, 15, 33);
    
    docInstance.setDrawColor(243, 244, 246);
    docInstance.line(15, 38, 195, 38);

    autoTable(docInstance, {
      startY: 42,
      head: headers,
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [249, 168, 37], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, textColor: [55, 65, 81] },
      margin: { left: 15, right: 15 }
    });

    docInstance.save(`${fileName}.pdf`);
  }

  // FIXED STEP GATE: Only write a record document if shouldArchive flag evaluates to true
  if (shouldArchive) {
    try {
      await addDoc(collection(db, "reports_archive"), {
        reportName: `${reportType} System Report`,
        type: reportType,
        format: format.toUpperCase(),
        downloadedAt: new Date(),
        fileUrl: `${fileName}.${format}`
      });
      console.log("Archive System: Log document successfully saved to Firestore.");
    } catch (dbError) {
      console.error("Archive System: Failed to write history record log:", dbError);
    }
  }

  return fileName;
};

/**
 * FIXED: Re-triggers file downloads from the history card table list without generating duplicate log rows
 */
export const downloadArchivedFile = async (logRecord) => {
  try {
    const reportType = logRecord.type;
    const format = logRecord.format.toLowerCase();
    
    // FIXED: Passed third parameter as false to tell the engine to skip the addDoc database step
    await generateAndArchiveReport(reportType, format, false);
  } catch (err) {
    console.error("Failed to re-trigger archive download:", err);
    alert("Re-download Error: " + err.message);
  }
};

/**
 * Permanently deletes an archive entry log from the Cloud Firestore collection
 */
export const deleteArchivedRecord = async (logId) => {
  const recordRef = doc(db, "reports_archive", logId);
  await deleteDoc(recordRef);
};
