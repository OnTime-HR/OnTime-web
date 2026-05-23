// src/pages/dashboard/NewsEventsPage.jsx
import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar, Pin, Trash2, Eye } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

const NewsEventsPage = () => {
  const [newsList, setNewsList] = useState([]);

  // Live stream connection to company_news collection
  useEffect(() => {
    const qNews = query(collection(db, "company_news"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(qNews, (snap) => {
      setNewsList(snap.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        description: doc.data().description,
        tag: doc.data().tag || 'Announcement',
        image: doc.data().imageUrl || "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg",
        date: doc.data().createdAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Recent'
      })));
    });

    return () => unsubscribe();
  }, []);

  // Simple delete function for admin management
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        await deleteDoc(doc(db, "company_news", id));
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    }
  };

  return (
    <div className="p-10">
      {/* SECTION 1: Top Row Analytics cards */}
      <div className="grid grid-cols-3 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Announcements</p>
            <h3 className="text-3xl font-bold text-gray-900">{newsList.length}</h3>
          </div>
          <div className="p-3 bg-[#FFF4E5] rounded-xl text-[#F9A825]">
            <Megaphone size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Active Events</p>
            <h3 className="text-3xl font-bold text-gray-900">2</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Calendar size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Pinned Posts</p>
            <h3 className="text-3xl font-bold text-gray-900">1</h3>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <Pin size={24} />
          </div>
        </div>
      </div>

      {/* SECTION 2: Management Table View */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#FFF9F0]/30">
          <h3 className="font-bold text-gray-900 text-base">All News & Announcements</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 tracking-wider bg-gray-50/50 uppercase">
                <th className="p-4 pl-6 w-1/3">Article Info</th>
                <th className="p-4 w-1/3">Snippet</th>
                <th className="p-4">Date Published</th>
                <th className="p-4">Tag</th>
                <th className="p-4 pr-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {newsList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
                  {/* Article Title & Image */}
                  <td className="p-4 pl-6 flex items-center gap-4">
                    <img 
                      src={item.image} 
                      alt="News Banner" 
                      className="w-16 h-10 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                    />
                    <div className="max-w-xs truncate">
                      <h4 className="font-bold text-gray-800 truncate leading-tight">{item.title}</h4>
                    </div>
                  </td>

                  {/* Snippet Description */}
                  <td className="p-4 text-gray-500 font-medium max-w-sm truncate">
                    {item.description}
                  </td>

                  {/* Date Published */}
                  <td className="p-4 text-gray-500 font-medium">{item.date}</td>

                  {/* Tag badge */}
                  <td className="p-4">
                    <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-50 text-amber-600 rounded-md uppercase">
                      {item.tag}
                    </span>
                  </td>

                  {/* Operational Action Buttons */}
                  <td className="p-4 pr-6 text-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-[#F9A825] hover:bg-gray-50 rounded-lg transition-colors inline-flex items-center">
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {newsList.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-12">No registered news feeds found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsEventsPage;