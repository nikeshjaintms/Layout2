import React, { useState, useRef } from 'react';
import { CheckCircle2, Clock, XCircle, Loader2, Edit2, Trash2, Check, X, UploadCloud } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Swal from 'sweetalert2';

export default function ConversionQueue({ conversions, selectedId, onSelect, onDelete, onUpdate, onReupload, onActivate }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const fileInputRef = useRef(null);
  const [uploadingId, setUploadingId] = useState(null);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'FAILED': return <XCircle size={16} className="text-red-500" />;
      case 'PROCESSING': return <Loader2 size={16} className="text-indigo-500 animate-spin" />;
      default: return <Clock size={16} className="text-zinc-500" />;
    }
  };

  const startEdit = (e, conv) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditName(conv.originalFileName);
  };

  const cancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const saveEdit = (e, id) => {
    e.stopPropagation();
    if (editName.trim()) {
      onUpdate(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    Swal.fire({
      title: 'Delete Conversion?',
      text: 'Are you sure you want to delete this conversion?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#ef4444',
      background: '#18181b',
      color: '#fff'
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(id);
      }
    });
  };

  const handleReuploadClick = (e, id) => {
    e.stopPropagation();
    setUploadingId(id);
    fileInputRef.current?.click();
  };

  const handleActivateClick = (e, id) => {
    e.stopPropagation();
    if (onActivate) onActivate(id);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && uploadingId) {
      onReupload(uploadingId, file);
    }
    // ensure input is cleared so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploadingId(null);
  };

  if (!conversions || conversions.length === 0) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm">
        No conversions yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <input type="file" ref={fileInputRef} className="hidden" accept=".dwg,.dxf" onChange={handleFileChange} />
      <div className="px-4 py-3 border-b border-white/10 sticky top-0 bg-[#0f111a]/90 backdrop-blur z-10">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#8ba0b8]">Recent Conversions</h2>
      </div>
      <div className="flex flex-col">
        {conversions.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`group relative flex items-start gap-3 p-4 border-b border-white/5 text-left transition-colors cursor-pointer hover:bg-white/5 touch-manipulation
              ${selectedId === conv.id ? 'bg-[#1d2440]/50 border-l-2 border-l-[#00c8ff] pl-[14px]' : 'border-l-2 border-l-transparent'}`}
          >
            <div className="mt-0.5 shrink-0">
              {getStatusIcon(conv.status)}
            </div>
            <div className="flex-1 min-w-0 pr-14 sm:pr-12">
              {editingId === conv.id ? (
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 bg-[#0f111a] border border-white/20 rounded px-2 py-1 text-sm text-white outline-none focus:border-[#00c8ff]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(e, conv.id);
                      if (e.key === 'Escape') cancelEdit(e);
                    }}
                  />
                  <button onClick={(e) => saveEdit(e, conv.id)} className="text-emerald-500 hover:text-emerald-400">
                    <Check size={16} />
                  </button>
                  <button onClick={cancelEdit} className="text-red-500 hover:text-red-400">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="text-sm font-bold text-white truncate" title={conv.originalFileName}>
                  {conv.originalFileName}
                </div>
              )}
              <div className="text-xs text-[#8ba0b8] mt-1 flex items-center gap-2 font-medium">
                <span className={conv.isActive ? "text-[#00c8ff] font-bold" : "text-[#8ba0b8]/50"}>
                  {conv.isActive ? "Active" : "Inactive"}
                </span>
                <span>•</span>
                <span className="capitalize">{conv.status.toLowerCase()}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
            {/* Actions overlay — always visible on touch devices, hover-only on desktop */}
            {editingId !== conv.id && (
              <div className="absolute right-2 top-3 flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-[#1d2440]/90 backdrop-blur-sm rounded-lg p-1 shadow-lg border border-white/10">
                {!conv.isActive && conv.status === 'SUCCESS' && (
                  <button
                    onClick={(e) => handleActivateClick(e, conv.id)}
                    className="text-emerald-400 hover:text-emerald-300 active:text-emerald-300 p-2 sm:p-1.5 rounded hover:bg-white/10 active:bg-white/10 transition-colors touch-manipulation text-[10px] font-bold uppercase tracking-wider"
                    title="Set as Active Layout"
                  >
                    Activate
                  </button>
                )}
                <button
                  onClick={(e) => handleReuploadClick(e, conv.id)}
                  className="text-[#8ba0b8] hover:text-[#00c8ff] active:text-[#00c8ff] p-2 sm:p-1.5 rounded hover:bg-white/10 active:bg-white/10 transition-colors touch-manipulation"
                  title="Replace File"
                >
                  <UploadCloud size={15} />
                </button>
                <button
                  onClick={(e) => startEdit(e, conv)}
                  className="text-[#8ba0b8] hover:text-white active:text-white p-2 sm:p-1.5 rounded hover:bg-white/10 active:bg-white/10 transition-colors touch-manipulation"
                  title="Rename"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="text-[#8ba0b8] hover:text-red-400 active:text-red-400 p-2 sm:p-1.5 rounded hover:bg-white/10 active:bg-white/10 transition-colors touch-manipulation"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
