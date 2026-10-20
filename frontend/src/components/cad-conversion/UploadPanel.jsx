import React, { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { uploadConversion } from '@/redux/slices/conversionsSlice';
import { UploadCloud, Loader2 } from 'lucide-react';

export default function UploadPanel({ projectId, onUploadStart, onUploadError }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const dispatch = useDispatch();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'dwg' && ext !== 'dxf') {
      onUploadError('Only DWG and DXF files are supported.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      onUploadError('File size exceeds 100MB limit.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    onUploadStart();

    const formData = new FormData();
    formData.append('file', file);
    if (projectId) {
      formData.append('projectId', projectId);
    }

    try {
      await dispatch(uploadConversion({ formData })).unwrap();
    } catch (err) {
      onUploadError(err || 'Upload failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <input 
        type="file" 
        accept=".dwg,.dxf"
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#ABD2FA] hover:bg-[#ABD2FA]/10 hover:shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 hover:text-gray-900 group"
      >
        {isUploading ? (
          <Loader2 size={24} className="animate-spin text-[#ABD2FA]" />
        ) : (
          <UploadCloud size={24} className="group-hover:-translate-y-1 transition-transform duration-300" />
        )}
        <span className="text-xs font-bold uppercase tracking-wider">
          {isUploading ? 'Uploading...' : 'Upload DWG/DXF'}
        </span>
      </button>
    </div>
  );
}
