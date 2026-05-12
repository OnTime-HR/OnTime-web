const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  valueColor,
}) => {
  return (
    <div className="bg-white rounded-3xl p-7 border border-orange-100 shadow-sm hover:shadow-md transition-all duration-300">

      {/* Icon */}
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconBg}`}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="mt-6">

        <p className="text-gray-500 text-lg">
          {title}
        </p>

        <h2 className={`text-5xl font-bold mt-3 ${valueColor}`}>
          {value}
        </h2>

        <p className="text-gray-400 mt-3">
          {subtitle}
        </p>

      </div>

    </div>
  );
};

export default StatCard;