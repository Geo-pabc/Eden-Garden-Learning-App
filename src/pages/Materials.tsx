import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { CLASSES, SUBJECTS, Material } from '../types';
import { BookOpen, Video, FileText, Plus, Search, ExternalLink, Upload, Loader2, Trash2, Edit2, X, AlertTriangle } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const Materials: React.FC = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedClass, setSelectedClass] = useState(user?.class_name || CLASSES[0]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; materialId: number | null }>({
    isOpen: false,
    materialId: null
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    type: 'pdf' as const,
    url: '',
    class_name: user?.class_name || CLASSES[0],
    subject: SUBJECTS[0]
  });

  useEffect(() => {
    fetchMaterials();
  }, [selectedClass, selectedSubject]);

  const fetchMaterials = () => {
    fetch(`/api/materials?class_name=${selectedClass}&subject=${selectedSubject}`)
      .then(res => res.json())
      .then(setMaterials);
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    let finalUrl = newMaterial.url;

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

    if (!finalUrl) {
      alert("Please provide a URL or upload a file.");
      setUploading(false);
      return;
    }

    const response = await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newMaterial, url: finalUrl, uploaded_by: user?.id }),
    });
    if (response.ok) {
      setShowAddModal(false);
      fetchMaterials();
      setNewMaterial({ ...newMaterial, title: '', url: '' });
      setSelectedFile(null);
    }
    setUploading(false);
  };

  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    setUploading(true);
    let finalUrl = editingMaterial.url;

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

    const response = await fetch(`/api/materials/${editingMaterial.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editingMaterial, url: finalUrl }),
    });
    if (response.ok) {
      setEditingMaterial(null);
      fetchMaterials();
      setSelectedFile(null);
    }
    setUploading(false);
  };

  const handleDeleteMaterial = async () => {
    if (deleteConfirm.materialId) {
      await fetch(`/api/materials/${deleteConfirm.materialId}`, { method: 'DELETE' });
      fetchMaterials();
      setDeleteConfirm({ isOpen: false, materialId: null });
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
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 self-end"
          >
            <Plus className="w-5 h-5" />
            Upload Material
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${
                item.type === 'video' ? 'bg-red-50 text-red-500' :
                item.type === 'pdf' ? 'bg-blue-50 text-blue-500' :
                'bg-emerald-50 text-emerald-500'
              }`}>
                {item.type === 'video' ? <Video className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              </div>
              {(user?.role === 'admin' || user?.id === item.uploaded_by) && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingMaterial(item)}
                    className="p-2 text-slate-300 hover:text-primary transition-colors"
                    title="Edit Material"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setDeleteConfirm({ isOpen: true, materialId: item.id })}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    title="Delete Material"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            <h4 className="font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">{item.title}</h4>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-4">
              <span className="uppercase">{item.type}</span>
              <span>•</span>
              <span>{new Date(item.created_at).toLocaleDateString()}</span>
            </div>
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              View {item.type === 'video' ? 'Lesson' : 'Material'}
            </a>
          </div>
        ))}
        {materials.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="text-slate-400 w-8 h-8" />
            </div>
            <h3 className="text-slate-900 font-bold">No materials found</h3>
            <p className="text-slate-500 text-sm">Try selecting a different class or subject.</p>
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
              Upload Material
            </h2>
            <form onSubmit={handleAddMaterial} className="space-y-4">
              {/* ... form content ... */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">URL (PDF or Video Link)</label>
                <input
                  type="url"
                  className="input-field"
                  value={newMaterial.url}
                  onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
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
                          setNewMaterial(prev => ({ ...prev, url: '' }));
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    className="input-field"
                    value={newMaterial.type}
                    onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value as any })}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="video">Video Lesson</option>
                    <option value="note">Study Note</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    className="input-field"
                    value={newMaterial.subject}
                    onChange={(e) => setNewMaterial({ ...newMaterial, subject: e.target.value })}
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Class</label>
                <select
                  className="input-field"
                  value={newMaterial.class_name}
                  onChange={(e) => setNewMaterial({ ...newMaterial, class_name: e.target.value })}
                >
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
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
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingMaterial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setEditingMaterial(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Edit2 className="text-primary" />
              Edit Material
            </h2>
            <form onSubmit={handleUpdateMaterial} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={editingMaterial.title}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">URL (PDF or Video Link)</label>
                <input
                  type="url"
                  className="input-field"
                  value={editingMaterial.url}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, url: e.target.value })}
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    className="input-field"
                    value={editingMaterial.type}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, type: e.target.value as any })}
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="video">Video Lesson</option>
                    <option value="note">Study Note</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    className="input-field"
                    value={editingMaterial.subject}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, subject: e.target.value })}
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Class</label>
                <select
                  className="input-field"
                  value={editingMaterial.class_name}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, class_name: e.target.value })}
                >
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setEditingMaterial(null)}
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
        title="Delete Material"
        message="Are you sure you want to delete this study material? Students will no longer be able to access this file."
        onConfirm={handleDeleteMaterial}
        onCancel={() => setDeleteConfirm({ isOpen: false, materialId: null })}
        confirmText="Delete Material"
      />
    </div>
  );
};
