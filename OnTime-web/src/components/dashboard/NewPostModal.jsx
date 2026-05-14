import React, { useState } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X } from 'lucide-react';

const NewPostModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({ title: '', description: '', tag: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Debugging: Check console to see if this runs
    console.log("Attempting to save:", formData);

    try {
      // Logic to match image_a1a3e1.png
      const docRef = await addDoc(collection(db, "company_news"), {
        title: formData.title,
        description: formData.description,
        tag: formData.tag,
        createdAt: serverTimestamp() 
      });
      
      console.log("Document saved with ID:", docRef.id);
      onClose();
      setFormData({ title: '', description: '', tag: '' });
    } catch (error) {
      // Check your browser console (F12) for this error!
      console.error("FIREBASE SAVE ERROR:", error.code, error.message);
      alert("Failed to save: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md p-8 relative shadow-2xl">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold text-[#F9A825] mb-6">Create New Post</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            placeholder="Title"
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#F9A825]"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
          <input
            placeholder="Tag (e.g. Awesome)"
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#F9A825]"
            value={formData.tag}
            onChange={(e) => setFormData({...formData, tag: e.target.value})}
          />
          <textarea
            required
            placeholder="Description"
            rows="4"
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-[#F9A825] resize-none"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
          <button
            disabled={loading}
            type="submit"
            className="w-full bg-[#F9A825] text-white font-bold py-3 rounded-xl shadow-md hover:bg-orange-500 disabled:opacity-50"
          >
            {loading ? 'POSTING...' : 'PUBLISH POST'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewPostModal;