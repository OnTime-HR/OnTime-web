import React from 'react';
import { Users, CheckCircle, Mail, ShieldAlert } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon, iconColor }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start">
        <h3 className="text-gray-500 font-medium text-sm">{title}</h3>
        <div className={`${iconColor}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <h2 className="text-3xl font-bold text-[#F9A825]">{value}</h2>
        {subtitle && <p className="text-gray-400 text-xs mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

const UserStatCards = ({ stats, loading }) => {
  const totalVal = loading ? '...' : (stats?.total || 0).toLocaleString();
  const activeVal = loading ? '...' : (stats?.active || 0).toLocaleString();
  const pendingVal = loading ? '...' : (stats?.pending || 0).toLocaleString();
  const adminsVal = loading ? '...' : (stats?.admins || 0).toLocaleString();
  
  const engagement = stats?.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
  const activeSubtitle = loading ? 'Calculating...' : `${engagement}% engagement rate`;

  const statItems = [
    {
      title: 'Total Employees',
      value: totalVal,
      subtitle: 'Registered staff members',
      icon: <Users size={22} />,
      iconColor: 'text-blue-500'
    },
    {
      title: 'Active Users',
      value: activeVal,
      subtitle: activeSubtitle,
      icon: <CheckCircle size={22} />,
      iconColor: 'text-green-500'
    },
    {
      title: 'Pending Invites',
      value: pendingVal,
      subtitle: 'Awaiting acceptance',
      icon: <Mail size={22} />,
      iconColor: 'text-orange-400'
    },
    {
      title: 'Admins',
      value: adminsVal,
      subtitle: 'Full system access',
      icon: <ShieldAlert size={22} />,
      iconColor: 'text-purple-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default UserStatCards;
