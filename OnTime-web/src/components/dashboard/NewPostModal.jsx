// src/components/dashboard/NewPostModal.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { X, Image, Link, Clock, FileText, Trash2, Video, Mic, CheckCircle, UploadCloud, FileDown, ExternalLink, AlertTriangle } from 'lucide-react';

const NewPostModal = ({ isOpen, onClose, editPostData = null, triggerToast }) => {
  const CLOUD_NAME = "dfqeymqdx";
  const UPLOAD_PRESET = "ontimeweb";

  const isEditMode = !!editPostData;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Active',
    linkUrl: '',
    startDate: '',
    endDate: '',
    imageUrl: '',
    videoUrl: '',
    fileUrl: ''
  });

  const [uploadProgress, setUploadProgress] = useState({ image: false, video: false, file: false });
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowDeleteConfirm(false);
      if (editPostData) {
        setFormData({
          title: editPostData.title || '',
          description: editPostData.description || '',
          status: editPostData.status || 'Active',
          linkUrl: editPostData.linkUrl || '',
          startDate: editPostData.startDate || '',
          endDate: editPostData.endDate || '',
          imageUrl: editPostData.imageUrl || '',
          videoUrl: editPostData.videoUrl || '',
          fileUrl: editPostData.fileUrl || ''
        });
      } else {
        setFormData({
          title: '', description: '', status: 'Active', linkUrl: '', startDate: '', endDate: '', imageUrl: '', videoUrl: '', fileUrl: ''
        });
      }
    }
  }, [isOpen, editPostData]);

  if (!isOpen) return null;

  const handleDirectUpload = async (e, slotType) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadProgress(prev => ({ ...prev, [slotType]: true }));
    const dataToSend = new FormData();
    dataToSend.append("file", file);
    dataToSend.append("upload_preset", UPLOAD_PRESET);

    let endpointType = "image";
    if (slotType === 'video') endpointType = "video";
    if (slotType === 'file') endpointType = "raw";

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpointType}/upload`, {
        method: "POST",
        body: dataToSend
      });
      const parsedRes = await response.json();

      if (parsedRes.secure_url) {
        const targetField = slotType === 'image' ? 'imageUrl' : slotType === 'video' ? 'videoUrl' : 'fileUrl';
        setFormData(prev => ({ ...prev, [targetField]: parsedRes.secure_url }));
        if (triggerToast) triggerToast("success", `${slotType.toUpperCase()} asset pinned successfully!`);
      } else {
        if (triggerToast) triggerToast("error", "Cloudinary handshake rejected payload parameters.");
      }
    } catch (err) {
      if (triggerToast) triggerToast("error", "Asset upload failed: " + err.message);
    } finally {
      setUploadProgress(prev => ({ ...prev, [slotType]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const payload = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      linkUrl: formData.linkUrl,
      startDate: formData.startDate,
      endDate: formData.endDate,
      imageUrl: formData.imageUrl || "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg",
      videoUrl: formData.videoUrl,
      fileUrl: formData.fileUrl,
      updatedAt: serverTimestamp()
    };

    try {
      if (isEditMode) {
        await updateDoc(doc(db, "company_news", editPostData.id), payload);
        if (triggerToast) triggerToast("success", "Announcement synchronized successfully!");
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "company_news"), payload);
        if (triggerToast) triggerToast("success", "New broadcast deployed to client feeds!");
      }

      // FORCED ACTION: Instantly clear tracking variables to force a clean closing loop
      setLoading(false);
      onClose();
    } catch (error) {
      setLoading(false);
      if (triggerToast) triggerToast("error", "Database crash: " + error.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (loading) return;
    setLoading(true);
    setShowDeleteConfirm(false);
    try {
      await deleteDoc(doc(db, "company_news", editPostData.id));
      if (triggerToast) triggerToast("success", "Announcement removed from cloud registry.");

      setLoading(false);
      onClose(); // Cleanly closes modal immediately after deletion
    } catch (error) {
      setLoading(false);
      if (triggerToast) triggerToast("error", "Deletion failure: " + error.message);
    }
  };

  const removeAssetSlot = (slot) => {
    const fieldMap = { image: 'imageUrl', video: 'videoUrl', file: 'fileUrl' };
    setFormData(prev => ({ ...prev, [fieldMap[slot]]: '' }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-[2.5rem] w-full max-w-xl p-8 relative shadow-2xl border border-gray-50 flex flex-col max-h-[85vh] overflow-y-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        <button type="button" onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors border-0 outline-none bg-transparent cursor-pointer">
          <X size={22} />
        </button>

        <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2 tracking-tight">
          <FileText className="text-[#F9A825]" size={22} /> {isEditMode ? 'Edit Broadcast Profile' : 'Deploy Multi-Channel Bulletin'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Heading</label>
              <input
                required placeholder="Enter heading title"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-[#F9A825] transition-colors"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-xs font-bold text-gray-700 outline-none focus:border-[#F9A825] cursor-pointer"
              >
                {/* Clean, binary status options requested */}
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Detailed Content Description</label>
            <textarea
              required placeholder="Compose announcement details..." rows="3"
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-medium outline-none focus:border-[#F9A825] resize-none leading-relaxed"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Action Link URL</label>
              <div className="relative flex items-center">
                <Link size={14} className="absolute left-4 text-gray-400" />
                <input
                  type="url" placeholder="https://..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-3 text-xs font-mono outline-none focus:border-[#F9A825]"
                  value={formData.linkUrl} onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Start Date</label>
                <input
                  type="date" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-2 py-2.5 text-[11px] font-semibold outline-none focus:border-[#F9A825]"
                  value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">End Date</label>
                <input
                  type="date" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-2 py-2.5 text-[11px] font-semibold outline-none focus:border-[#F9A825]"
                  value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* MASTER MEDIA ASSETS REVIEW SPACE */}
          {(formData.videoUrl || formData.fileUrl) && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block mb-1">
                Attached Media Resources (Live Review)
              </span>

              {formData.videoUrl && (
                <div className="rounded-xl overflow-hidden bg-black shadow-inner">
                  <video src={formData.videoUrl} controls className="w-full max-h-36 object-contain" />
                </div>
              )}

              {formData.fileUrl && (
                <div className="flex items-center justify-between p-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-600 truncate max-w-[70%]">
                    <CheckCircle size={14} className="flex-shrink-0" />
                    <span className="truncate font-mono text-[11px] text-gray-500">{formData.fileUrl.split('/').pop()}</span>
                  </div>
                  <a
                    href={formData.fileUrl} target="_blank" rel="noreferrer"
                    className="text-[10px] bg-gray-100 hover:bg-[#F9A825] hover:text-white text-gray-600 px-2.5 py-1 rounded-md transition-all font-black uppercase tracking-wide flex items-center gap-1"
                  >
                    View <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* SIMULTANEOUS UPLOAD ZONE */}
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Multimedia Stream Channels (Simultaneous)</label>
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-gray-100 rounded-2xl p-3 bg-gray-50/50 flex flex-col items-center justify-between text-center min-h-[140px]">
                <span className="text-[9px] font-black tracking-wider uppercase text-gray-400 flex items-center gap-1"><Image size={11} /> Cover Image</span>
                {formData.imageUrl ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden mt-2 group border">
                    <img src={formData.imageUrl} alt="Attached" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeAssetSlot('image')} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-[10px] transition-opacity border-0 cursor-pointer">Remove</button>
                  </div>
                ) : (
                  <label className="w-full flex flex-col items-center justify-center p-3 bg-white border border-dashed rounded-xl cursor-pointer mt-2 flex-1 hover:bg-amber-50/50 transition-colors">
                    <UploadCloud size={18} className={uploadProgress.image ? "animate-bounce text-[#F9A825]" : "text-gray-400"} />
                    <span className="text-[10px] font-bold text-gray-500 mt-1">{uploadProgress.image ? 'Loading...' : 'Upload Image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDirectUpload(e, 'image')} />
                  </label>
                )}
              </div>

              <div className="border border-gray-100 rounded-2xl p-3 bg-gray-50/50 flex flex-col items-center justify-between text-center min-h-[140px]">
                <span className="text-[9px] font-black tracking-wider uppercase text-gray-400 flex items-center gap-1"><Video size={11} /> Video Stream</span>
                {formData.videoUrl ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden mt-2 group border bg-black flex items-center justify-center">
                    <Video size={20} className="text-white/60 animate-pulse" />
                    <button type="button" onClick={() => removeAssetSlot('video')} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-[10px] transition-opacity border-0 cursor-pointer">Remove</button>
                  </div>
                ) : (
                  <label className="w-full flex flex-col items-center justify-center p-3 bg-white border border-dashed rounded-xl cursor-pointer mt-2 flex-1 hover:bg-amber-50/50 transition-colors">
                    <Video size={18} className={uploadProgress.video ? "animate-bounce text-[#F9A825]" : "text-gray-400"} />
                    <span className="text-[10px] font-bold text-gray-500 mt-1">{uploadProgress.video ? 'Streaming...' : 'Upload Video'}</span>
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => handleDirectUpload(e, 'video')} />
                  </label>
                )}
              </div>

              <div className="border border-gray-100 rounded-2xl p-3 bg-gray-50/50 flex flex-col items-center justify-between text-center min-h-[140px]">
                <span className="text-[9px] font-black tracking-wider uppercase text-gray-400 flex items-center gap-1"><FileText size={11} /> PDF / Docs</span>
                {formData.fileUrl ? (
                  <div className="relative w-full aspect-video rounded-xl mt-2 group border bg-emerald-50 text-emerald-700 flex flex-col items-center justify-center p-2">
                    <FileDown size={18} />
                    <span className="text-[9px] font-mono font-bold truncate max-w-full mt-1">Linked File</span>
                    <button type="button" onClick={() => removeAssetSlot('file')} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-[10px] transition-opacity border-0 cursor-pointer">Remove</button>
                  </div>
                ) : (
                  <label className="w-full flex flex-col items-center justify-center p-3 bg-white border border-dashed rounded-xl cursor-pointer mt-2 flex-1 hover:bg-amber-50/50 transition-colors">
                    <FileText size={18} className={uploadProgress.file ? "animate-bounce text-[#F9A825]" : "text-gray-400"} />
                    <span className="text-[10px] font-bold text-gray-500 mt-1">{uploadProgress.file ? 'Wired...' : 'Upload Brief'}</span>
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleDirectUpload(e, 'file')} />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            {isEditMode && (
              <button
                type="button" disabled={loading} onClick={() => setShowDeleteConfirm(true)}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-3 rounded-xl transition-colors disabled:opacity-50 border-0 outline-none cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              disabled={loading || Object.values(uploadProgress).some(Boolean)} type="submit"
              className="w-full bg-[#F9A825] hover:bg-orange-500 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors text-xs tracking-wider uppercase disabled:opacity-50 border-0 outline-none cursor-pointer"
            >
              {loading ? 'Publishing Data...' : isEditMode ? 'Commit Entry Details' : 'Publish Multi-Channel Broadcast'}
            </button>
          </div>
        </form>
      </div>

      {/* BRAND-MATCHED SYSTEM DELETE CONFIRMATION POPUP MODAL */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[99999] p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 text-center shadow-2xl border border-gray-50 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-black text-gray-800 tracking-tight">Confirm Permanent Deletion</h3>
            <p className="text-xs text-gray-400 font-medium mt-2 leading-relaxed">
              Are you sure you want to permanently remove this announcement? This action cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button" onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold py-3 rounded-xl border-0 outline-none transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button" onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-3 rounded-xl border-0 outline-none transition-colors shadow-sm cursor-pointer"
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewPostModal;