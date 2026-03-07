import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { Notice } from '../types';
import { Bell, Plus, Calendar, Trash2, X } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const Notices: React.FC = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [newNotice, setNewNotice] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; noticeId: number | null }>({
    isOpen: false,
    noticeId: null
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = () => {
    fetch('/api/notices')
      .then(res => res.json())
      .then(setNotices);
  };

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newNotice }),
    });
    if (response.ok) {
      setShowAddModal(false);
      setNewNotice('');
      fetchNotices();
    }
  };

  const handleDeleteNotice = async () => {
    if (deleteConfirm.noticeId) {
      await fetch(`/api/notices/${deleteConfirm.noticeId}`, { method: 'DELETE' });
      fetchNotices();
      setDeleteConfirm({ isOpen: false, noticeId: null });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">School Notices</h1>
          <p className="text-slate-500 text-sm">Stay updated with the latest announcements.</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Post Notice
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {notices.map((notice) => (
          <div key={notice.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group">
            <div className="flex items-start gap-4">
              <div className="bg-amber-50 p-3 rounded-xl text-amber-500">
                <Bell className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-slate-700 leading-relaxed">{notice.content}</p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <Calendar className="w-3 h-3" />
                    {new Date(notice.created_at).toLocaleString()}
                  </div>
                  {user?.role === 'admin' && (
                    <button 
                      onClick={() => setDeleteConfirm({ isOpen: true, noticeId: notice.id })}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {notices.length === 0 && (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-100">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="text-slate-400 w-8 h-8" />
            </div>
            <h3 className="text-slate-900 font-bold">No notices yet</h3>
            <p className="text-slate-500 text-sm">Check back later for updates.</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Bell className="text-primary" />
              Post New Notice
            </h2>
            <form onSubmit={handleAddNotice} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notice Content</label>
                <textarea
                  required
                  rows={5}
                  className="input-field resize-none"
                  placeholder="Type the announcement here..."
                  value={newNotice}
                  onChange={(e) => setNewNotice(e.target.value)}
                />
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 btn-primary font-semibold"
                >
                  Post Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Notice"
        message="Are you sure you want to delete this notice? This will remove it from all student and teacher dashboards."
        onConfirm={handleDeleteNotice}
        onCancel={() => setDeleteConfirm({ isOpen: false, noticeId: null })}
        confirmText="Delete Notice"
      />
    </div>
  );
};
