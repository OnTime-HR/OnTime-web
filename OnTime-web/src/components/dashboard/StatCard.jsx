import React from 'react';

const StatCard = ({ icon, label, value, subtext, iconBg, textColor }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3 flex-1">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        <h2 className={`text-4xl font-bold my-1 ${textColor}`}>{value}</h2>
        <p className="text-gray-400 text-xs">{subtext}</p>
      </div>
    </div>
  );
};

export default StatCard;