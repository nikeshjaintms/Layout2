import React from 'react';
import { MousePointer2, ZoomIn, Layers, Settings2, Eraser, Scissors, Wand, Minus, Circle, Spline, Hexagon, Type, ArrowRight, PaintBucket } from 'lucide-react';

export default function CadEditorToolbar({ activeTool, onToolChange }) {
  const tools = [
    { id: 'pointer',        icon: MousePointer2, label: 'Pointer (V)' },
    { id: 'zoom_window',    icon: ZoomIn,        label: 'Zoom Window (Z)' },
    { id: 'eraser',         icon: Eraser,        label: 'Object Eraser (E)' },
    { id: 'partial_delete', icon: Scissors,      label: 'Partial Delete (X)' },
    { id: 'vector_eraser',  icon: Wand,          label: 'Vector Eraser (Y)' },
    { id: 'paint_bucket',   icon: PaintBucket,   label: 'Paint Bucket (F)' },
    { id: 'draw_text',    icon: Type,          label: 'Add Text (T)' },
    { id: 'draw_line',    icon: Minus,         label: 'Draw Line (L)' },
    { id: 'draw_arrow',   icon: ArrowRight,    label: 'Draw Arrow (R)' },
    { id: 'draw_circle',  icon: Circle,        label: 'Draw Circle (C)' },
    { id: 'draw_curve',   icon: Spline,        label: 'Draw Curve (U)' },
    { id: 'draw_polygon', icon: Hexagon,       label: 'Draw Polygon (P)' },
  ];

  return (
    <div className="flex z-10 h-full">
      <div className="w-10 md:w-12 bg-[#0f111a]/90 backdrop-blur-md border-r border-white/10 flex flex-col items-center py-2 md:py-4 gap-2 md:gap-4 z-20 overflow-y-auto [&::-webkit-scrollbar]:hidden shadow-lg">
      <div className="flex flex-col gap-1 md:gap-2 w-full px-1 md:px-2">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => { onToolChange(tool.id); }}
            title={tool.label}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all mx-auto ${
              activeTool === tool.id 
                ? 'bg-[#00c8ff]/20 text-[#00c8ff] shadow-[inset_0_0_10px_rgba(0,200,255,0.2)] border border-[#00c8ff]/30' 
                : 'text-[#8ba0b8] hover:text-[#00c8ff] hover:bg-white/10'
            }`}
          >
            <tool.icon size={16} />
          </button>
        ))}
      </div>
      
      </div>
    </div>
  );
}
