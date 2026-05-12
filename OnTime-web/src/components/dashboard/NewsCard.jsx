const NewsCard = () => {
  return (
    <div className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden h-[520px]">

      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">

        <div>

          <h2 className="text-3xl font-bold text-orange-500">
            News & Announcements
          </h2>

          <p className="text-gray-500 mt-1">
            Latest company updates
          </p>

        </div>

        <button className="bg-orange-500 text-white px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all">

          New Post

        </button>

      </div>

      {/* Image Section */}
      <div className="p-6">

        <div className="relative rounded-3xl overflow-hidden">

          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d"
            alt="meeting"
            className="w-full h-[240px] object-cover"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-6">

            <span className="bg-blue-500 text-white text-sm px-3 py-1 rounded-xl w-fit">
              Published
            </span>

            <h3 className="text-white text-3xl font-bold mt-4">
              Q4 Strategy Meeting
            </h3>

            <p className="text-white/80 mt-3 text-lg">
              Mandatory attendance for all department heads.
            </p>

          </div>

        </div>

        {/* Additional News */}
        <div className="mt-6 space-y-4">

          {/* Item */}
          <div className="p-4 rounded-2xl bg-orange-50">

            <p className="font-semibold text-gray-900">
              Office Renovation Update
            </p>

            <p className="text-sm text-gray-500 mt-1">
              2 hours ago
            </p>

          </div>

          {/* Item */}
          <div className="p-4 rounded-2xl bg-gray-50">

            <p className="font-semibold text-gray-900">
              Employee Wellness Program
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Yesterday
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};

export default NewsCard;