// src/components/users/BulkImport.jsx
import React, { useState, useRef } from 'react';
import { UploadCloud, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const BulkImport = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) processCSV(files[0]);
  };

  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      processCSV(e.target.files[0]);
    }
  };

  const processCSV = (file) => {
    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      setResult({ type: 'error', text: 'Please upload a valid CSV file.' });
      return;
    }

    setIsUploading(true);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = text.split('\n').map(row => row.trim()).filter(row => row);
        
        if (rows.length < 2) throw new Error("CSV is empty or missing data.");

        // Parse headers to find indexes
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        const nameIdx = headers.indexOf('name');
        const phoneIdx = headers.indexOf('phone');
        const roleIdx = headers.indexOf('role');

        if (nameIdx === -1 || phoneIdx === -1 || roleIdx === -1) {
          throw new Error("CSV headers must be exactly: Name, Phone, Role");
        }

        let successCount = 0;

        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(',').map(c => c.trim());
          if (cols.length < 3) continue; // Skip broken rows

          const name = cols[nameIdx];
          const phone = cols[phoneIdx];
          const role = cols[roleIdx];

          if (!phone) continue;

          // Format phone to ensure it starts with '+'
          const cleanPhone = phone.startsWith('+') ? phone : `+${phone}`;

          // Construct the strict document object
          const userData = {
            name: name,
            phone: cleanPhone,
            role: role || 'Employee',
            userType: (role || 'Employee').toLowerCase(),
            company_code: "COM100", // Defaulting to your company code
            invited: true,
            dark_mode: false,
            notifications_enabled: true,
            status: "Pending",
            createdAt: serverTimestamp()
          };

          // Save to Firebase using Phone as Document ID
          await setDoc(doc(db, "pre_authorized_users", cleanPhone), userData);
          successCount++;
        }

        setResult({ type: 'success', text: `Successfully imported ${successCount} users!` });
      } catch (error) {
        setResult({ type: 'error', text: error.message });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div 
      className={`rounded-2xl transition-all p-8 flex flex-col items-center justify-center text-center h-full min-h-[280px] ${
        isDragging 
          ? 'border-2 border-dashed border-[#F9A825] bg-amber-50/50' 
          : 'bg-white border border-gray-100 shadow-sm hover:border-gray-200'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        accept=".csv" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
      />

      {isUploading ? (
        <div className="flex flex-col items-center">
          <Loader2 size={40} className="text-[#F9A825] animate-spin mb-4" />
          <h3 className="text-lg font-bold text-gray-800">Processing Data...</h3>
          <p className="text-xs text-gray-500 mt-2">Writing users to secure database.</p>
        </div>
      ) : (
        <>
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-[#F9A825] mb-4">
            <UploadCloud size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Bulk Import Employees</h3>
          <p className="text-xs text-gray-500 mt-2 max-w-[250px] mb-6">
            Drag and drop your CSV file here to instantly add multiple users to the system.
          </p>
          
          <button 
            onClick={() => fileInputRef.current.click()}
            className="px-6 py-2.5 bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold text-sm rounded-xl transition-colors outline-none cursor-pointer"
          >
            Browse Files
          </button>

          {result && (
            <div className={`mt-5 flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg ${
              result.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {result.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {result.text}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BulkImport;