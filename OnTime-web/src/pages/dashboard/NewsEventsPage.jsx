// src/pages/dashboard/NewsEventsPage.jsx
import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar, Pin, Edit, Plus, ExternalLink } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import NewPostModal from '../../components/dashboard/NewPostModal';

const NewsEventsPage = () => {
  const [newsList, setNewsList] = useState([]);

  // Dual Modal Action control variables
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const qNews = query(collection(db, "company_news"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(qNews, (snap) => {
      setNewsList(snap.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        description: doc.data().description,
        status: doc.data().status || 'Active',
        linkUrl: doc.data().linkUrl || '',
        startDate: doc.data().startDate || '',
        endDate: doc.data().endDate || '',
        image: doc.data().imageUrl || "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg",
        date: doc.data().createdAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Recent'
      })));
    });

    return () => unsubscribe();
  }, []);

  const handleOpenEditModal = (post) => {
    setSelectedPost(post);
    setModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setSelectedPost(null);
    setModalOpen(true);
  };

  const statusBadges = {
    Active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Ongoing: 'bg-blue-50 text-blue-600 border-blue-100',
    Upcoming: 'bg-amber-50 text-amber-600 border-amber-100',
    Expired: 'bg-gray-50 text-gray-500 border-gray-100'
  };

  return (
    <div className="p-10">

      {/* SECTION 1: Metrics Analytics Row */}
      <div className="grid grid-cols-3 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Announcements</p>
            <h3 className="text-3xl font-black text-gray-900">{newsList.length}</h3>
          </div>
          <div className="p-3 bg-[#FFF4E5] rounded-xl text-[#F9A825]"><Megaphone size={22} /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Ongoing & Upcoming Events</p>
            <h3 className="text-3xl font-black text-gray-900">
              {newsList.filter(n => n.status === 'Ongoing' || n.status === 'Upcoming').length}
            </h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Calendar size={22} /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Expired Archives</p>
            <h3 className="text-3xl font-black text-gray-900">{newsList.filter(n => n.status === 'Expired').length}</h3>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><Pin size={22} /></div>
        </div>
      </div>

      {/* SECTION 2: Management Table View Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#FFF9F0]/30">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Corporate Bulletin Repository</h3>
            <p className="text-xs text-gray-400 mt-0.5">Deploy news, stream live event limits, and manage multimedia data cards.</p>
          </div>

          {/* FEATURE 1: Control Button to launch Add form */}
          <button
            type="button" onClick={handleOpenCreateModal}
            className="bg-[#F9A825] hover:bg-orange-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-colors flex items-center gap-2"
          >
            <Plus size={15} /> Deploy New Post
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 tracking-wider bg-gray-50/50 uppercase">
                <th className="p-4 pl-6 w-1/3">Article Context Details</th>
                <th className="p-4 w-1/3">Snippet Brief</th>
                <th className="p-4">Horizon Duration</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {newsList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="p-4 pl-6 flex items-center gap-4">
                    <img src={item.image} alt="Media" className="w-16 h-10 object-cover rounded-lg border flex-shrink-0" />
                    <div className="max-w-xs truncate">
                      <h4 className="font-bold text-gray-800 truncate leading-tight">{item.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">Published: {item.date}</p>
                    </div>
                  </td>

                  <td className="p-4 text-gray-500 font-medium max-w-sm truncate">{item.description}</td>

                  <td className="p-4 text-xs font-bold text-gray-600 font-mono">
                    {item.startDate ? `${item.startDate} to ${item.endDate || 'End'}` : 'Single Broadcast'}
                  </td>

                  <td className="p-4">
                    <span className={`text-[10px] font-black px-2.5 py-1 border rounded-md uppercase tracking-wide ${statusBadges[item.status]}`}>
                      {item.status}
                    </span>
                  </td>

                  <td className="p-4 pr-6 text-center">
                    <button
                      type="button" onClick={() => handleOpenEditModal(item)}
                      className="p-2 text-gray-400 hover:text-[#F9A825] hover:bg-amber-50 border border-transparent hover:border-amber-100 rounded-lg transition-all inline-flex items-center gap-1.5 font-bold text-xs"
                    >
                      <Edit size={14} /> Review & Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {newsList.length === 0 && <p className="text-xs text-gray-400 text-center py-12">No active entries found.</p>}
        </div>
      </div>

      {/* Near the bottom of src/pages/dashboard/NewsEventsPage.jsx */}
      <NewPostModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editPostData={selectedPost}
        triggerToast={(type, message) => {
          // Harnesses the existing custom notification toast engine built into the page layout
          setToast({ isOpen: true, type, message });
        }}
      />
    </div>
  );
};

export default NewsEventsPage;