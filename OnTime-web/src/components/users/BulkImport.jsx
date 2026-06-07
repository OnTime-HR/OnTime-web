import React, { useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { bulkImportEmployees } from '../../services/employeeService';
import toast from 'react-hot-toast';

const BulkImport = () => {
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await processCSVFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        await processCSVFile(file);
      } else {
        toast.error('Only CSV files are supported!');
      }
    }
  };

  const processCSVFile = async (file) => {
    setImporting(true);
    const loadingToast = toast.loading('Reading and parsing CSV...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') {
        toast.error('Failed to read CSV file content.', { id: loadingToast });
        setImporting(false);
        return;
      }

      try {
        const employeesList = parseCSV(text);
        if (employeesList.length === 0) {
          toast.error('No valid employee records found in CSV.', { id: loadingToast });
          setImporting(false);
          return;
        }

        toast.loading(`Importing ${employeesList.length} employees...`, { id: loadingToast });
        await bulkImportEmployees(employeesList);
        toast.success(`Successfully imported ${employeesList.length} employees!`, { id: loadingToast });
      } catch (err) {
        toast.error('Failed to import employees: ' + err.message, { id: loadingToast });
      } finally {
        setImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      toast.error('Error reading CSV file.', { id: loadingToast });
      setImporting(false);
    };

    reader.readAsText(file);
  };

  // Helper function to parse CSV safely
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).map(line => line.trim());
    if (lines.length < 2) return [];

    // Parse headers to match columns
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    
    const nameIndex = headers.indexOf('name');
    const emailIndex = headers.indexOf('email');
    const phoneIndex = headers.indexOf('phone');
    const roleIndex = headers.indexOf('role');
    const statusIndex = headers.indexOf('status');

    const employees = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Split line by comma, keeping quotes in mind if possible, or simple splitting
      const columns = line.split(',').map(c => c.trim().replace(/['"]/g, ''));
      if (columns.length === 0 || !columns[0]) continue;

      let name = '';
      let email = '';
      let phone = '';
      let role = 'Employee';
      let status = 'Active';

      // Resolve by detected headers, otherwise by index
      if (nameIndex !== -1 && columns[nameIndex]) name = columns[nameIndex];
      else if (columns[0]) name = columns[0];

      if (emailIndex !== -1 && columns[emailIndex]) email = columns[emailIndex];
      else if (columns[1]) email = columns[1];

      if (phoneIndex !== -1 && columns[phoneIndex]) phone = columns[phoneIndex];
      else if (columns[2]) phone = columns[2];

      if (roleIndex !== -1 && columns[roleIndex]) role = columns[roleIndex];
      else if (columns[3]) role = columns[3];

      if (statusIndex !== -1 && columns[statusIndex]) status = columns[statusIndex];
      else if (columns[4]) status = columns[4];

      // Validate basic email format to skip headers or invalid rows
      if (email && email.includes('@')) {
        employees.push({ name, email, phone, role, status });
      }
    }

    return employees;
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-[#FFF8ED] rounded-2xl p-8 flex flex-col items-center justify-center border-2 border-dashed text-center transition-all min-h-[220px] ${
        isDragOver ? 'border-[#F9A825] bg-[#FFF2DE]' : 'border-[#F9E8D2]'
      }`}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        accept=".csv"
        className="hidden" 
      />

      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-dashed border-[#F9A825]">
        {importing ? (
          <Loader2 className="text-[#F9A825] animate-spin" size={24} />
        ) : (
          <FileUp className="text-[#F9A825]" size={24} />
        )}
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">Bulk Import Employees</h3>
      
      <p className="text-gray-500 text-sm max-w-sm mb-4">
        {importing 
          ? 'Processing your employee file, please wait...' 
          : 'Drag and drop your CSV file here to add multiple users at once.'}
      </p>
      
      <button 
        onClick={handleBrowseFiles}
        disabled={importing}
        className="text-[#F9A825] font-bold hover:underline transition-all cursor-pointer disabled:opacity-50 disabled:hover:no-underline"
      >
        Browse Files
      </button>
    </div>
  );
};

export default BulkImport;
