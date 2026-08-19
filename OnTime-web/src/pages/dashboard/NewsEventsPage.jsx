// src/pages/dashboard/NewsEventsPage.jsx
import React, { useState, useEffect } from 'react';
import { Megaphone, Pin, Edit, Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
import { db } from '../../services/firebase';
// FIXED: Added updateDoc and doc to imports for the auto-expiration engine
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import NewPostModal from '../../components/dashboard/NewPostModal';

const NewsEventsPage = () => {
  const [newsList, setNewsList] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All'); 
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [toast, setToast] = useState({ isOpen: false, type: 'success', message: '' });

  useEffect(() => {
    const qNews = query(collection(db, "company_news"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(qNews, (snap) => {
      // 1. Establish strict midnight cutoff for accurate date comparisons
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const loadedNews = [];

      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        let currentStatus = data.status || 'Active';

        // ======================================================================
        // REAL-TIME AUTO-EXPIRATION ENGINE
        // ======================================================================
        if (data.endDate && currentStatus === 'Active') {
          const endObj = new Date(data.endDate);
          endObj.setHours(0, 0, 0, 0);

          // If the post end date is strictly in the past, auto-expire it
          if (endObj < today) {
            currentStatus = 'Expired';
            // Asynchronously update the live database quietly in the background
            updateDoc(doc(db, "company_news", docSnap.id), { status: 'Expired' })
              .catch(err => console.error("Auto-expire DB update failed:", err));
          }
        }

        loadedNews.push({
          id: docSnap.id,
          title: data.title,
          description: data.description,
          status: currentStatus, // Renders the securely evaluated status
          linkUrl: data.linkUrl || '',
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          imageUrl: data.imageUrl || '',
          videoUrl: data.videoUrl || '',
          fileUrl: data.fileUrl || '',
          image: data.imageUrl || "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg",
          date: data.createdAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Recent',
          rawCreatedAt: data.createdAt // Preserves exact chronological timeline
        });
      });

      setNewsList(loadedNews);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (toast.isOpen) {
      const timer = setTimeout(() => setToast(prev => ({ ...prev, isOpen: false })), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.isOpen]);

  const handleOpenEditModal = (post) => {
    setSelectedPost(post);
    setModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setSelectedPost(null);
    setModalOpen(true);
  };

  const triggerToastNotification = (type, message) => {
    setToast({ isOpen: true, type, message });
  };

  const statusBadges = {
    Active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Expired: 'bg-gray-50 text-gray-500 border-gray-100'
  };

  const filteredNewsList = newsList.filter(item => {
    if (activeFilter === 'Expired') return item.status === 'Expired';
    return true; 
  });

  const expiredCount = newsList.filter(n => n.status === 'Expired').length;

  return (
    <div className="p-10 relative">

      <div className="grid grid-cols-2 gap-8 mb-8">
        
        <div 
          onClick={() => setActiveFilter('All')}
          className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all transform hover:-translate-y-0.5 ${
            activeFilter === 'All' 
              ? 'bg-amber-50/40 border-[#F9A825] ring-1 ring-[#F9A825]/20' 
              : 'bg-white border-gray-100 hover:border-gray-200'
          }`}
        >
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Announcements</p>
            <h3 className="text-3xl font-black text-gray-900">{newsList.length}</h3>
            <span className="text-[10px] text-gray-400 font-medium mt-1 block">Click to view all articles</span>
          </div>
          <div className="p-3 bg-[#FFF4E5] rounded-xl text-[#F9A825]"><Megaphone size={22} /></div>
        </div>

        <div 
          onClick={() => setActiveFilter('Expired')}
          className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all transform hover:-translate-y-0.5 ${
            activeFilter === 'Expired' 
              ? 'bg-purple-50/40 border-purple-400 ring-1 ring-purple-400/20' 
              : 'bg-white border-gray-100 hover:border-gray-200'
          }`}
        >
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Expired Archives</p>
            <h3 className="text-3xl font-black text-gray-900">{expiredCount}</h3>
            <span className="text-[10px] text-gray-400 font-medium mt-1 block">Click to isolate expired records</span>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><Pin size={22} /></div>
        </div>

      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#FFF9F0]/30">
          
          <button
            type="button" onClick={handleOpenCreateModal}
            className="bg-[#F9A825] hover:bg-orange-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-colors flex items-center gap-2 border-0 cursor-pointer outline-none"
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
              {filteredNewsList.map((item) => (
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
                      className="p-2 text-gray-400 hover:text-[#F9A825] hover:bg-amber-50 border border-transparent hover:border-amber-100 rounded-lg transition-all inline-flex items-center gap-1.5 font-bold text-xs cursor-pointer outline-none"
                    >
                      <Edit size={14} /> Review & Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredNewsList.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-12">No matching archive posts found for this selection filter.</p>
          )}
        </div>
      </div>

      <NewPostModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPost(null);
        }}
        editPostData={selectedPost}
        triggerToast={triggerToastNotification}
      />

      {toast.isOpen && (
        <div className="fixed bottom-6 right-6 z-[10000] flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-200 min-w-[280px]">
          {toast.type === 'success' ? (
            <CheckCircle className="text-emerald-400 flex-shrink-0" size={18} />
          ) : (
            <AlertCircle className="text-rose-400 flex-shrink-0" size={18} />
          )}
          <span className="text-xs font-semibold tracking-tight">{toast.message}</span>
          <button 
            type="button" 
            onClick={() => setToast(prev => ({ ...prev, isOpen: false }))}
            className="ml-auto text-gray-400 hover:text-white transition-colors bg-transparent border-0 outline-none cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NewsEventsPage;