// src/components/dashboard/AttendanceChart.jsx
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';

// NEW: Added the custom date props to the component parameters
const AttendanceChart = ({ 
  data, 
  currentFilter, 
  isDropdownOpen, 
  setIsDropdownOpen, 
  setTimeFilter,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate 
}) => {
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
      <div className="flex justify-between items-center mb-8 relative">
        <div>
          <h3 className="text-lg font-bold text-[#F9A825]">Attendance Trends</h3>
          <p className="text-sm text-gray-400">Weekly employee presence overview</p>
        </div>
        
        {/* NEW: Flex container to align the date pickers next to the dropdown */}
        <div className="flex items-center">
          
          {/* CUSTOM DATE PICKERS: Only show if "Custom Range" is selected */}
          {currentFilter === 'Custom Range' && (
            <div className="flex items-center gap-2 mr-4 animate-in fade-in zoom-in duration-200">
              <input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 outline-none focus:border-[#F9A825] focus:ring-1 focus:ring-[#F9A825] transition-all cursor-pointer"
              />
              <span className="text-gray-400 text-sm font-medium">to</span>
              <input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 outline-none focus:border-[#F9A825] focus:ring-1 focus:ring-[#F9A825] transition-all cursor-pointer"
              />
            </div>
          )}

          {/* CUSTOM DROPDOWN BUTTON WRAPPER CONTAINER */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-[#F9A825] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-orange-500 transition-colors outline-none whitespace-nowrap"
            >
              {currentFilter} <ChevronDown size={18} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Renders the custom options overlay smoothly when the parent state toggles */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* NEW: Added 'Custom Range' to the options array */}
                {['This Week', 'This Month', 'This Year', 'Custom Range'].map((filterOption) => (
                  <button
                    key={filterOption}
                    type="button"
                    onClick={() => {
                      setTimeFilter(filterOption); 
                      setIsDropdownOpen(false);    
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
      </div>

      {/* Responsive graph lines visualization box map */}
      <div className="h-72 w-full bg-[#FFF9F0] rounded-2xl border border-orange-50 p-6 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={({ x, y, payload }) => (
                <text 
                  x={x} 
                  y={y + 20} 
                  // REMOVED quotes around todayStr
                  fill={payload.value === todayStr && currentFilter === 'This Week' ? '#F9A825' : '#9CA3AF'} 
                  fontSize={12} 
                  // REMOVED quotes around todayStr
                  fontWeight={payload.value === todayStr && currentFilter === 'This Week' ? 'bold' : 'normal'} 
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
              dataKey="Active Staff" 
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