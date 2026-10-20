import React from 'react';
import { AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CadEditorWorkspace from './editor/CadEditorWorkspace';

export default function SvgPreview({ conversion, conversions = [], projectId }) {
  const router = useRouter();

  const renderContent = () => {
    if (!conversion) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 bg-[#0A0A0A]">
          <ImageIcon size={48} className="mb-4 opacity-50" />
          <p>No conversion selected</p>
        </div>
      );
    }

    if (conversion.status === 'PROCESSING') {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 bg-[#0A0A0A]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4"></div>
          <p>Converting {conversion.originalFileName}...</p>
        </div>
      );
    }

    if (conversion.status === 'FAILED') {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-[#0A0A0A]">
          <AlertCircle size={48} className="mb-4 opacity-50" />
          <p>Conversion Failed</p>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 bg-[#0f1115]">
        <CadEditorWorkspace 
          conversionId={conversion.id} 
          projectId={projectId} 
          readOnly={true} 
        />
      </div>
    );
  };

  return (
    <div className="absolute inset-0 w-full h-full">
      {renderContent()}

      {/* Continue Editing Overlay - Only visible if a conversion is selected */}
      {conversion && (() => {
        const targetConversionId = conversion.status === 'SUCCESS' ? conversion.id : null;

        return (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={() => {
                if (targetConversionId) {
                  router.push(`/cad-conversion/${projectId}/editor/${targetConversionId}`);
                }
              }}
              disabled={!targetConversionId}
              className={`flex items-center justify-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 text-[10px] sm:text-xs uppercase tracking-wider font-bold rounded-full transition-all duration-300 shrink-0
                ${targetConversionId 
                  ? 'bg-[#ABD2FA] hover:bg-[#9bc2ea] text-[#18181b] border border-[#ABD2FA] shadow-sm hover:shadow-md' 
                  : 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed border border-zinc-700/50'}`}
              title={!targetConversionId ? "This conversion failed or is still processing" : ""}
            >
              {!targetConversionId ? 'No Editor Available' : 'Continue Editing'}
              {targetConversionId && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
            </button>
          </div>
        );
      })()}
    </div>
  );
}

