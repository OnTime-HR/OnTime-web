// src/components/dashboard/AttendanceChart.jsx
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';

const AttendanceChart = () => {
  // Dummy data to simulate the visual heights in the image
  const data = [
    { day: 'Mon', value: 40 }, 
    { day: 'Tue', value: 55 }, 
    { day: 'Wed', value: 45 },
    { day: 'Thu', value: 75 }, 
    { day: 'Fri', value: 50 }, 
    { day: 'Sat', value: 30 }, 
    { day: 'Sun', value: 25 }
  ];

  return (
    /* Outer container with min-height to prevent layout shift */
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-lg font-bold text-[#F9A825]">Attendance Trends</h3>
          <p className="text-sm text-gray-400">Weekly employee presence overview</p>
        </div>
        <button className="flex items-center gap-2 bg-[#F9A825] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-orange-500 transition-colors">
          This Week <ChevronDown size={18} />
        </button>
      </div>

      {/* 
          FIX: The div wrapping ResponsiveContainer MUST have a defined height (h-72) 
          and width (w-full) for Recharts to calculate its size properly. 
      */}
      <div className="h-72 w-full bg-[#FFF9F0] rounded-2xl border border-orange-50 p-6 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <XAxis 
              dataKey="day" 
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
              dataKey="value" 
              fill="#F9A825" 
              radius={[4, 4, 0, 0]} 
              barSize={25} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttendanceChart;