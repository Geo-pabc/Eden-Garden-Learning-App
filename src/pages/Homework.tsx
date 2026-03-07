import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { CLASSES, SUBJECTS, Homework } from '../types';
import { ClipboardList, Plus, FileText, Download, Calendar, Upload, Loader2, Trash2, Edit2, X, AlertTriangle } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const HomeworkPage: React.FC = () => {
  const { user } = useAuth();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [selectedClass, setSelectedClass] = useState(user?.class_name || CLASSES[0]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; homeworkId: number | null }>({
    isOpen: false,
    homeworkId: null
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newHomework, setNewHomework] = useState({
    title: '',
    description: '',
    file_url: '',
    class_name: user?.class_name || CLASSES[0],
    subject: SUBJECTS[0]
  });

  useEffect(() => {
    fetchHomework();
  }, [selectedClass, selectedSubject]);

  const fetchHomework = () => {
    fetch(`/api/homework?class_name=${selectedClass}&subject=${selectedSubject}`)
      .then(res => res.json())
      .then(setHomework);
  };

  const handleAddHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    let finalUrl = newHomework.file_url;

    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        const uploadRes = await fetch('/api/file-upload', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadRes.ok) {
          const contentType = uploadRes.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const { url } = await uploadRes.json();
            finalUrl = url;
          } else {
            const text = await uploadRes.text();
            console.error("Unexpected response format:", text.substring(0, 100));
            alert("Server returned an unexpected response format. Please check the console.");
            setUploading(false);
            return;
          }
        } else {
          const errorText = await uploadRes.text();
          console.error("Upload failed:", uploadRes.status, errorText);
          alert(`Upload failed: ${uploadRes.status}. Please check the console.`);
          setUploading(false);
          return;
        }
      } catch (err) {
        console.error("Upload failed", err);
        alert("Upload failed. Please check your connection and try again.");
        setUploading(false);
        return;
      }
    }

    const response = await fetch('/api/homework', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newHomework, file_url: finalUrl, teacher_id: user?.id }),
    });
    if (response.ok) {
      setShowAddModal(false);
      fetchHomework();
      setNewHomework({ ...newHomework, title: '', description: '', file_url: '' });
      setSelectedFile(null);
    }
    setUploading(false);
  };

  const handleUpdateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHomework) return;
    setUploading(true);
    let finalUrl = editingHomework.file_url;

    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        const uploadRes = await fetch('/api/file-upload', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          finalUrl = url;
        }
      } catch (err) {
        console.error("Upload failed", err);
      }
    }

    const response = await fetch(`/api/homework/${editingHomework.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editingHomework, file_url: finalUrl }),
    });
    if (response.ok) {
      setEditingHomework(null);
      fetchHomework();
      setSelectedFile(null);
    }
    setUploading(false);
  };

  const handleDeleteHomework = async () => {
    if (deleteConfirm.homeworkId) {
      await fetch(`/api/homework/${deleteConfirm.homeworkId}`, { method: 'DELETE' });
      fetchHomework();
      setDeleteConfirm({ isOpen: false, homeworkId: null });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Class</label>
            <select 
              className="input-field py-1 text-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={user?.role === 'student'}
            >
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</label>
            <select 
              className="input-field py-1 text-sm"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 self-end"
          >
            <Plus className="w-5 h-5" />
            Assign Homework
          </button>
        )}
      </div>

      <div className="space-y-4">
        {homework.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase">
                    {item.subject}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
                {(user?.role === 'admin' || user?.id === item.teacher_id) && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingHomework(item)}
                      className="p-2 text-slate-300 hover:text-primary transition-colors"
                      title="Edit Homework"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm({ isOpen: true, homeworkId: item.id })}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      title="Delete Homework"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <h4 className="font-bold text-slate-900 text-lg mb-1">{item.title}</h4>
              <p className="text-slate-600 text-sm line-clamp-2">{item.description}</p>
            </div>
            <div className="flex flex-col gap-3 min-w-[200px]">
              {item.file_url && (
                <a 
                  href={item.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 shadow-sm hover:shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download Homework
                </a>
              )}
              {!item.file_url && (
                <div className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-xs font-medium text-center border border-dashed border-slate-200">
                  No attachment
                </div>
              )}
            </div>
          </div>
        ))}
        {homework.length === 0 && (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-100">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="text-slate-400 w-8 h-8" />
            </div>
            <h3 className="text-slate-900 font-bold">No homework assigned</h3>
            <p className="text-slate-500 text-sm">Everything is up to date!</p>
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
              <Plus className="text-primary" />
              Assign Homework
            </h2>
            <form onSubmit={handleAddHomework} className="space-y-4">
              {/* ... form content ... */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newHomework.title}
                  onChange={(e) => setNewHomework({ ...newHomework, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  className="input-field resize-none"
                  value={newHomework.description}
                  onChange={(e) => setNewHomework({ ...newHomework, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">File URL (PDF/Image)</label>
                <input
                  type="url"
                  className="input-field"
                  value={newHomework.file_url}
                  onChange={(e) => setNewHomework({ ...newHomework, file_url: e.target.value })}
                  placeholder="https://..."
                  disabled={!!selectedFile}
                />
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-px flex-1 bg-slate-100"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Upload File</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group">
                    <Upload className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                    <span className="text-sm text-slate-500 group-hover:text-primary font-medium">
                      {selectedFile ? selectedFile.name : 'Choose file...'}
                    </span>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setSelectedFile(e.target.files[0]);
                          setNewHomework(prev => ({ ...prev, file_url: '' }));
                        }
                      }}
                    />
                  </label>
                  {selectedFile && (
                    <button 
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-xs text-red-500 font-bold hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    className="input-field"
                    value={newHomework.subject}
                    onChange={(e) => setNewHomework({ ...newHomework, subject: e.target.value })}
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Class</label>
                  <select
                    className="input-field"
                    value={newHomework.class_name}
                    onChange={(e) => setNewHomework({ ...newHomework, class_name: e.target.value })}
                  >
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
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
                  disabled={uploading}
                  className="flex-1 btn-primary font-semibold flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingHomework && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setEditingHomework(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Edit2 className="text-primary" />
              Edit Homework
            </h2>
            <form onSubmit={handleUpdateHomework} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={editingHomework.title}
                  onChange={(e) => setEditingHomework({ ...editingHomework, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  className="input-field resize-none"
                  value={editingHomework.description}
                  onChange={(e) => setEditingHomework({ ...editingHomework, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">File URL (PDF/Image)</label>
                <input
                  type="url"
                  className="input-field"
                  value={editingHomework.file_url}
                  onChange={(e) => setEditingHomework({ ...editingHomework, file_url: e.target.value })}
                  placeholder="https://..."
                  disabled={!!selectedFile}
                />
              </div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-px flex-1 bg-slate-100"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Upload New File (Optional)</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group">
                    <Upload className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                    <span className="text-sm text-slate-500 group-hover:text-primary font-medium">
                      {selectedFile ? selectedFile.name : 'Choose file...'}
                    </span>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  {selectedFile && (
                    <button 
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-xs text-red-500 font-bold hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    className="input-field"
                    value={editingHomework.subject}
                    onChange={(e) => setEditingHomework({ ...editingHomework, subject: e.target.value })}
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Class</label>
                  <select
                    className="input-field"
                    value={editingHomework.class_name}
                    onChange={(e) => setEditingHomework({ ...editingHomework, class_name: e.target.value })}
                  >
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setEditingHomework(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={uploading}
                  className="flex-1 btn-primary font-semibold flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Homework"
        message="Are you sure you want to delete this homework assignment? This will remove it for all students in this class."
        onConfirm={handleDeleteHomework}
        onCancel={() => setDeleteConfirm({ isOpen: false, homeworkId: null })}
        confirmText="Delete Homework"
      />
    </div>
  );
};
