// src/components/dashboard/NewPostModal.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { X, Image, Link, Clock, FileText, Trash2 } from 'lucide-react';

const NewPostModal = ({ isOpen, onClose, editPostData = null, triggerToast }) => {
  // =========================================================
  // CLOUD MULTIMEDIA INTEGRATION CREDENTIALS
  // =========================================================
  const CLOUD_NAME = "ontime-df19b"; 
  const UPLOAD_PRESET = "ontime_presets"; // Replace with your exact Unsigned Upload Preset name

  const isEditMode = !!editPostData;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Active', 
    linkUrl: '',
    startDate: '',
    endDate: '',
    imageUrl: ''
  });

  const [mediaLoading, setMediaLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Synchronize modal state fields when transitioning between Add and Edit view modes
  useEffect(() => {
    if (isOpen) {
      if (editPostData) {
        setFormData({
          title: editPostData.title || '',
          description: editPostData.description || '',
          status: editPostData.status || 'Active',
          linkUrl: editPostData.linkUrl || '',
          startDate: editPostData.startDate || '',
          endDate: editPostData.endDate || '',
          imageUrl: editPostData.imageUrl || editPostData.image || ''
        });
      } else {
        setFormData({
          title: '', description: '', status: 'Active', linkUrl: '', startDate: '', endDate: '', imageUrl: ''
        });
      }
    }
  }, [isOpen, editPostData]);

  if (!isOpen) return null;

  // Handles streaming assets directly to Cloudinary via browser multipart streams
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMediaLoading(true);
    const dataToSend = new FormData();
    dataToSend.append("file", file);
    dataToSend.append("upload_preset", UPLOAD_PRESET);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: dataToSend
      });
      const parsedRes = await response.json();
      
      if (parsedRes.secure_url) {
        setFormData(prev => ({ ...prev, imageUrl: parsedRes.secure_url }));
        if (triggerToast) triggerToast("success", "Multimedia file parsed and attached securely!");
      } else {
        if (triggerToast) {
          triggerToast("error", "Upload parsing failed. Verify preset string constraints.");
        }
      }
    } catch (err) {
      console.error("Cloudinary Engine Fault:", err);
      if (triggerToast) triggerToast("error", "Media stream injection failed: " + err.message);
    } finally {
      setMediaLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      linkUrl: formData.linkUrl,
      startDate: formData.startDate,
      endDate: formData.endDate,
      imageUrl: formData.imageUrl || "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg",
      updatedAt: serverTimestamp()
    };

    try {
      if (isEditMode) {
        const docRef = doc(db, "company_news", editPostData.id);
        await updateDoc(docRef, payload);
        if (triggerToast) triggerToast("success", "Announcement updated successfully!");
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "company_news"), payload);
        if (triggerToast) triggerToast("success", "New announcement broadcasted onto system feeds!");
      }
      onClose();
    } catch (error) {
      console.error("Firestore Core Transaction Blocked:", error);
      if (triggerToast) triggerToast("error", "Database validation failure: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm("Are you sure you want to permanently remove this announcement?")) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, "company_news", editPostData.id));
        if (triggerToast) triggerToast("success", "Announcement removed from cloud registry.");
        onClose();
      } catch (error) {
        if (triggerToast) triggerToast("error", "Deletion failure: " + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 relative shadow-2xl border border-gray-50 flex flex-col max-h-[90vh] overflow-y-auto">
        
        <button type="button" onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={22} />
        </button>

        <h2 className="text-xl font-black text-[#F9A825] mb-6 flex items-center gap-2">
          <FileText size={20} /> {isEditMode ? 'Modify Article Stream' : 'Deploy Corporate Bulletin'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Article Heading</label>
              <input
                required placeholder="Enter heading title"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-[#F9A825] transition-colors"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Lifecycle Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-xs font-bold text-gray-700 outline-none focus:border-[#F9A825] cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Detailed Description</label>
            <textarea
              required placeholder="Compose announcement details..." rows="3"
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-medium outline-none focus:border-[#F9A825] resize-none leading-relaxed"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Redirect URL Hyperlink (Optional)</label>
            <div className="relative flex items-center">
              <Link size={14} className="absolute left-4 text-gray-400" />
              <input
                type="url" placeholder="https://example.com/details-page"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-3 text-xs font-mono outline-none focus:border-[#F9A825] transition-colors"
                value={formData.linkUrl}
                onChange={(e) => setFormData({...formData, linkUrl: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Clock size={12}/> Horizon Start</label>
              <input
                type="date" className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-[#F9A825]"
                value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Clock size={12}/> Horizon End</label>
              <input
                type="date" className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-[#F9A825]"
                value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Cover Feature Multimedia</label>
            <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Preview" className="w-20 h-14 object-cover rounded-xl border bg-white shadow-sm flex-shrink-0" />
              ) : (
                <div className="w-20 h-14 bg-gray-200/60 border border-dashed rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0">
                  <Image size={18} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <input
                  type="file" accept="image/*" id="cloudinary-uploader" className="hidden"
                  onChange={handleFileUpload} disabled={mediaLoading || loading}
                />
                <label
                  htmlFor="cloudinary-uploader"
                  className="inline-flex bg-white hover:bg-amber-50 text-gray-700 hover:text-[#F9A825] border border-gray-200 hover:border-amber-200 font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer select-none"
                >
                  {mediaLoading ? 'Uploading...' : 'Choose Device Media'}
                </label>
                <p className="text-[10px] text-gray-400 truncate mt-1.5 font-medium">Files sync instantly with your Cloudinary repository.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            {isEditMode && (
              <button
                type="button" disabled={loading} onClick={handleDeletePost}
                className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-3 rounded-xl transition-colors disabled:opacity-50"
                title="Delete Post"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              disabled={loading || mediaLoading} type="submit"
              className="w-full bg-[#F9A825] hover:bg-orange-500 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors uppercase text-xs tracking-wider disabled:opacity-50"
            >
              {loading ? 'Processing Transaction...' : isEditMode ? 'Commit Entry Details' : 'Publish Broadcast'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPostModal;