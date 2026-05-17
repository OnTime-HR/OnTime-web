import React from 'react';
import { FileUp } from 'lucide-react';

const BulkImport = () => {
  return (
    <div className="bg-[#FFF8ED] rounded-2xl p-8 flex flex-col items-center justify-center border-2 border-dashed border-[#F9E8D2] text-center">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-dashed border-[#F9A825]">
        <FileUp className="text-[#F9A825]" size={24} />
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">Bulk Import Employees</h3>
      
      <p className="text-gray-500 text-sm max-w-sm mb-4">
        Drag and drop your CSV file here to add multiple users at once.
      </p>
      
      <button className="text-[#F9A825] font-bold hover:underline transition-all cursor-pointer">
        Browse Files
      </button>
    </div>
  );
};

export default BulkImport;
