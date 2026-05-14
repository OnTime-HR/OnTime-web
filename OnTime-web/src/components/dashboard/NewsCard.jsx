// src/components/dashboard/NewsCard.jsx
import React from 'react';

const NewsCard = ({ title, description, time, image, isFeatured }) => {
  if (isFeatured) {
    return (
      <div className="relative rounded-xl overflow-hidden aspect-[1.4/1] mb-6 group cursor-pointer">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
          <span className="bg-[#3B82F6] text-white text-[10px] font-bold px-2 py-0.5 rounded w-fit mb-2">
            Published
          </span>
          <h3 className="text-white font-bold text-sm leading-tight">
            {title}
          </h3>
          <p className="text-gray-200 text-[10px] mt-1 line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 py-3 border-b border-gray-50 last:border-0 group cursor-pointer">
      <img src={image} alt={title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4 className="text-[11px] font-bold text-gray-800 truncate">{title}</h4>
          <span className="text-[9px] text-gray-400 whitespace-nowrap">{time}</span>
        </div>
        <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5 leading-normal">
          {description}
        </p>
      </div>
    </div>
  );
};

export default NewsCard;