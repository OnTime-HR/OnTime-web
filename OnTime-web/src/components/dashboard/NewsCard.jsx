// src/components/dashboard/NewsCard.jsx
import React from 'react';
import { Calendar, Layers } from 'lucide-react';

const NewsCard = ({ id, title, description, time, image, isFeatured, status, startDate, endDate, linkUrl, onClick }) => {
  
  // Custom Tailwind status indicator map colors
  const statusColors = {
    Active: 'bg-emerald-500 text-white',
    Ongoing: 'bg-blue-500 text-white',
    Upcoming: 'bg-amber-500 text-white',
    Expired: 'bg-gray-400 text-white'
  };

  const activeStatus = status || "Active";

  if (isFeatured) {
    return (
      <div 
        onClick={() => onClick({ id, title, description, time, image, status: activeStatus, startDate, endDate, linkUrl })}
        className="relative rounded-2xl overflow-hidden aspect-[1.5/1] mb-5 group cursor-pointer border border-gray-100 shadow-md transform hover:-translate-y-0.5 transition-all"
      >
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-5">
          <div className="flex gap-2 mb-2">
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm tracking-wide ${statusColors[activeStatus]}`}>
              {activeStatus}
            </span>
          </div>
          <h3 className="text-white font-black text-sm leading-snug group-hover:text-amber-300 transition-colors">
            {title}
          </h3>
          <p className="text-gray-300 text-[10px] mt-1 line-clamp-2 leading-relaxed opacity-90">
            {description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => onClick({ id, title, description, time, image, status: activeStatus, startDate, endDate, linkUrl })}
      className="flex gap-3 py-3 border-b border-gray-50 last:border-0 group cursor-pointer hover:bg-gray-50/50 px-2 rounded-xl transition-colors"
    >
      <img src={image} alt={title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-100 shadow-sm" />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-[11px] font-bold text-gray-800 group-hover:text-[#F9A825] transition-colors truncate leading-tight">
            {title}
          </h4>
          <span className="text-[9px] text-gray-400 whitespace-nowrap font-medium">{time}</span>
        </div>
        <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5 leading-normal">
          {description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[8px] font-bold uppercase px-1 rounded-sm scale-90 origin-left ${statusColors[activeStatus]}`}>
            {activeStatus}
          </span>
          {startDate && (
            <span className="text-[8px] text-gray-400 font-semibold flex items-center gap-0.5">
              <Calendar size={10} /> {startDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsCard;