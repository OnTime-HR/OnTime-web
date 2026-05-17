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

const UserStatCards = () => {
  const stats = [
    {
      title: 'Total Employees',
      value: '1,248',
      subtitle: '',
      icon: <Users size={22} />,
      iconColor: 'text-blue-500'
    },
    {
      title: 'Active Users',
      value: '1,180',
      subtitle: '94% engagement rate',
      icon: <CheckCircle size={22} />,
      iconColor: 'text-green-500'
    },
    {
      title: 'Pending Invites',
      value: '45',
      subtitle: 'Awaiting acceptance',
      icon: <Mail size={22} />,
      iconColor: 'text-orange-400'
    },
    {
      title: 'Admins',
      value: '12',
      subtitle: 'Full system access',
      icon: <ShieldAlert size={22} />,
      iconColor: 'text-purple-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default UserStatCards;
