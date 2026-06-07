// src/components/dashboard/AttendanceChart.jsx
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';

// Binds all dynamic props directly from the parent state manager
const AttendanceChart = ({ data, currentFilter, isDropdownOpen, setIsDropdownOpen, setTimeFilter }) => {
  return (
    /* Outer container with min-height to prevent layout shift */
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
      <div className="flex justify-between items-center mb-8 relative">
        <div>
          <h3 className="text-lg font-bold text-[#F9A825]">Attendance Trends</h3>
          <p className="text-sm text-gray-400">Weekly employee presence overview</p>
        </div>
        
        {/* CUSTOM DROPDOWN BUTTON WRAPPER CONTAINER */}
        <div className="relative">
          <button 
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-[#F9A825] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-orange-500 transition-colors outline-none"
          >
            {currentFilter} <ChevronDown size={18} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Renders the custom options overlay smoothly when the parent state toggles */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {['This Week', 'This Month', 'This Year'].map((filterOption) => (
                <button
                  key={filterOption}
                  type="button"
                  onClick={() => {
                    setTimeFilter(filterOption); // Changes the filter calculation logic state
                    setIsDropdownOpen(false);    // Closes the menu card dropdown view hook
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors ${
                    currentFilter === filterOption 
                      ? 'bg-amber-50 text-[#F9A825]' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {filterOption}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Responsive graph lines visualization box map */}
      <div className="h-72 w-full bg-[#FFF9F0] rounded-2xl border border-orange-50 p-6 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis 
              dataKey="name" // Map matching your dynamic compiled metrics object key string
              axisLine={false} 
              tickLine={false} 
              tick={({ x, y, payload }) => (
                <text 
                  x={x} 
                  y={y + 20} 
                  fill={payload.value === 'Thu' ? '#F9A825' : '#9CA3AF'} 
                  fontSize={12} 
                  fontWeight={payload.value === 'Thu' ? 'bold' : 'normal'} 
                  textAnchor="middle"
                >
                  {payload.value}
                </text>
              )}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(249, 168, 37, 0.1)' }} 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar 
              dataKey="Active Staff" // Match data object metric fields map parameter
              fill="#F9A825" 
              radius={[4, 4, 0, 0]} 
              barSize={currentFilter === 'This Year' ? 35 : 25} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttendanceChart;