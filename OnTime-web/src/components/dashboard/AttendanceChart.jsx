import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";

const data = [
  {
    day: "Mon",
    employees: 120,
  },
  {
    day: "Tue",
    employees: 138,
  },
  {
    day: "Wed",
    employees: 110,
  },
  {
    day: "Thu",
    employees: 142,
  },
  {
    day: "Fri",
    employees: 150,
  },
  {
    day: "Sat",
    employees: 90,
  },
  {
    day: "Sun",
    employees: 80,
  },
];

const AttendanceChart = () => {
  return (
    <div className="bg-white rounded-3xl p-7 border border-orange-100 shadow-sm h-[520px]">

      {/* Header */}
      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-4xl font-bold text-orange-500">
            Attendance Trends
          </h2>

          <p className="text-gray-500 mt-2 text-lg">
            Weekly employee presence overview
          </p>

        </div>

        {/* Button */}
        <button className="bg-orange-500 text-white px-6 py-4 rounded-2xl shadow-md hover:shadow-lg transition-all">

          This Week

        </button>

      </div>

      {/* Chart */}
      <div className="h-[380px] mt-10">

        <ResponsiveContainer width="100%" height="100%">

          <AreaChart data={data}>

            <XAxis
              dataKey="day"
              tick={{ fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="employees"
              stroke="#F59E0B"
              fill="#FDE7B0"
              strokeWidth={4}
            />

          </AreaChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
};

export default AttendanceChart;