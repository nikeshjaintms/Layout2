import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { format } from 'date-fns';

export default function ConversionConsole({ logs, selectedConversion }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, selectedConversion]);

  return (
    <div className="flex flex-col h-full">
      <div className="h-8 bg-[#1d2440]/60 border-b border-white/10 flex items-center px-4 shrink-0">
        <Terminal size={14} className="text-[#00c8ff] mr-2" />
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8ba0b8]">Conversion Console</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 bg-[#0f111a]/80 backdrop-blur-md">
        {logs.map((log, i) => (
          <div key={i} className={`flex gap-3 ${log.type === 'error' ? 'text-red-400' : 'text-slate-300'}`}>
            <span className="text-[#8ba0b8]/50 shrink-0">
              [{format(log.time, 'HH:mm:ss')}]
            </span>
            <span className="break-all">{log.message}</span>
          </div>
        ))}
        
        {selectedConversion && selectedConversion.status === 'SUCCESS' && (
          <div className="flex gap-3 text-emerald-400">
            <span className="text-[#8ba0b8]/50 shrink-0">
              [{format(new Date(selectedConversion.updatedAt), 'HH:mm:ss')}]
            </span>
            <span className="break-all">Conversion completed successfully for {selectedConversion.originalFileName}</span>
          </div>
        )}
        
        {selectedConversion && selectedConversion.status === 'FAILED' && (
          <div className="flex gap-3 text-red-400">
            <span className="text-[#8ba0b8]/50 shrink-0">
              [{format(new Date(selectedConversion.updatedAt), 'HH:mm:ss')}]
            </span>
            <span className="break-all">Failed to convert {selectedConversion.originalFileName}: {selectedConversion.errorMessage}</span>
          </div>
        )}
        
        <div ref={endRef} />
      </div>
    </div>
  );
}
