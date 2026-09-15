import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Undo2, Redo2, Maximize, RefreshCw } from 'lucide-react';
import { ColorPicker, ConfigProvider, theme } from 'antd';

export default function CadEditorTopBar({ 
  zoomPercent, 
  coords, 
  conversionName,
  projectId,
  isSaving, 
  onUndo, 
  onRedo, 
  onSave, 
  canUndo, 
  canRedo,
  activeTool,
  strokeWidth,
  onStrokeWidthChange,
  strokeColor,
  onStrokeColorChange,
  textFontSize,
  onTextFontSizeChange,
  textFontColor,
  onTextFontColorChange,
  textFontFamily,
  onTextFontFamilyChange,
  selectedShapes,
  showPlotStatus,
  onTogglePlotStatus,
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  plots,
  projectConfig,
  onPlotLabelStyleChange,
  appearanceSettings,
  applyToAll,
  onToggleApplyToAll,
  applyToAllAnnotations,
  onToggleApplyToAllAnnotations,
  activeLabelStyle,
  onActiveLabelStyleChange
}) {
  const isDrawingTool = activeTool === 'draw_line' || activeTool === 'draw_circle' || activeTool === 'draw_curve' || activeTool === 'draw_polygon' || activeTool === 'draw_text' || activeTool === 'draw_arrow';
  
  const STROKE_SUPPORTED_TYPES = new Set(['line', 'polyline', 'path', 'rect', 'circle', 'ellipse', 'polygon', 'text']);
  const selectedShape = selectedShapes?.[0];
  const canEditStroke = selectedShape && STROKE_SUPPORTED_TYPES.has(selectedShape.type);
  
  const isSingleSelected = selectedShapes?.length === 1;
  const selectedPlot = isSingleSelected ? plots?.find(p => p.cadRegionId === selectedShape?.id) : null;
  const isAnnotation = selectedShape && selectedShape.attributes?.['data-annotation'] === 'true';
  const isPlotCandidate = isSingleSelected && selectedShape && !isAnnotation && ['polygon', 'path', 'rect', 'circle', 'ellipse', 'polyline'].includes(selectedShape.type);
  const isPlotMode = !!selectedPlot || isPlotCandidate;

  const showStrokeUI = isDrawingTool || canEditStroke;
  
  const isTextTool = activeTool === 'draw_text';
  const canEditText = selectedShape && selectedShape.type === 'text';
  const showTextUI = isTextTool || canEditText;
  
  const selectedShapeSize = selectedShape 
    ? (selectedShape.type === 'text' 
       ? parseFloat(selectedShape.attributes?.['font-size']) 
       : parseFloat(selectedShape.attributes?.['stroke-width'])) 
    : undefined;

  const currentSizeVal = (selectedShapeSize !== undefined && !isNaN(selectedShapeSize)) 
    ? selectedShapeSize 
    : (isPlotMode ? 0.1 : (isTextTool || canEditText ? textFontSize : strokeWidth));
  
  const backUrl = projectId ? `/cad-conversion/${projectId}` : '/cad-conversion';
  
  const isTextMode = activeTool === 'draw_text' || selectedShape?.type === 'text';

  // Theme fallbacks
  const headerBg = appearanceSettings?.navColor || '#0f111a';
  const headerText = appearanceSettings?.navFontColor || '#ffffff';
  const headerSubText = appearanceSettings?.navFontColor ? `${appearanceSettings.navFontColor}cc` : '#8ba0b8';
  const btnBg = appearanceSettings?.buttonColor || '#00c8ff';
  const btnText = appearanceSettings?.buttonFontColor || '#0f111a';
  const panelBg = appearanceSettings?.navColor ? `${appearanceSettings.navColor}80` : '#1d2440'; // Semi-transparent for panels
  const isDarkNav = !appearanceSettings?.navColor || (appearanceSettings.navColor.toLowerCase() !== '#ffffff' && appearanceSettings.navColor.toLowerCase() !== 'white');

  const inputStyle = { 
    backgroundColor: isDarkNav ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)', 
    borderColor: btnBg, 
    color: btnBg 
  };

  const antdTheme = {
    algorithm: isDarkNav ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorBgContainer: isDarkNav ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
      colorBorder: btnBg,
      colorText: btnBg,
      borderRadius: 6,
    }
  };

  const ToolSettings = () => {
    if (isPlotMode) {
      const pMeta = selectedPlot ? (selectedPlot.metadata || {}) : (activeLabelStyle || {});
      const lblSize = pMeta.labelFontSize !== undefined && pMeta.labelFontSize !== null ? parseFloat(pMeta.labelFontSize) : (projectConfig?.labelFontSize ?? 2);
      const lblColor = pMeta.labelFontColor || projectConfig?.labelFontColor || '#ffffff';
      const lblFamily = pMeta.labelFontFamily || projectConfig?.labelFontFamily || 'sans-serif';
      const lblStrokeSize = pMeta.labelStrokeWidth !== undefined && pMeta.labelStrokeWidth !== null ? parseFloat(pMeta.labelStrokeWidth) : (projectConfig?.labelStrokeWidth ?? 0);

      const handleStyleChange = (updates) => {
        onActiveLabelStyleChange(updates);
        if (selectedPlot) {
          onPlotLabelStyleChange(selectedPlot.id, updates);
        } else if (applyToAll) {
          onPlotLabelStyleChange(null, updates);
        }
      };

      return (
        <ConfigProvider theme={antdTheme}>
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-[11px] font-medium" style={{ color: headerSubText }}>Color:</span>
              <ColorPicker
                value={lblColor}
                onChange={(_, hex) => handleStyleChange({ labelFontColor: hex })}
                size="small" showText format="hex"
                styles={{ popup: { zIndex: 9999 } }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-[11px] font-medium" style={{ color: headerSubText }}>Font:</span>
              <select
                value={lblFamily}
                onChange={(e) => handleStyleChange({ labelFontFamily: e.target.value })}
                className="h-7 border rounded px-2 text-[11px] focus:outline-none transition-colors"
                style={inputStyle}
                title="Font"
              >
                <option value="sans-serif">Sans Serif</option>
                <option value="serif">Serif</option>
                <option value="monospace">Monospace</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-[11px] font-medium" style={{ color: headerSubText }}>Text Size:</span>
              <input 
                type="number" min="0.1" step="0.1" max="100"
                value={lblSize}
                onChange={(e) => handleStyleChange({ labelFontSize: parseFloat(e.target.value) || 2 })}
                className="w-14 h-7 border rounded px-2 text-[11px] focus:outline-none transition-colors font-mono"
                style={inputStyle}
                title="Text Size"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-[11px] font-medium" style={{ color: headerSubText }}>Stroke Size:</span>
              <input 
                type="number" min="0" step="0.1" max="10"
                value={lblStrokeSize}
                onChange={(e) => {
                   const raw = e.target.value;
                   handleStyleChange({ labelStrokeWidth: raw === '' ? 0 : (parseFloat(raw) || 0) });
                }}
                onBlur={(e) => {
                   const v = parseFloat(e.target.value);
                   if (isNaN(v) || v < 0) handleStyleChange({ labelStrokeWidth: 0 });
                }}
                className="w-14 h-7 border rounded px-2 text-[11px] focus:outline-none transition-colors font-mono"
                style={inputStyle}
                title="Stroke Size"
              />
            </div>
            
            {/* Apply to All Toggle */}
            <div className="flex items-center gap-2 ml-2 pl-4 border-l" style={{ borderColor: isDarkNav ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
              <span className="hidden md:inline text-[11px] font-bold uppercase tracking-wider" style={{ color: headerSubText }} title="Apply style changes to all plots in layout">Apply to All</span>
              <button 
                onClick={onToggleApplyToAll}
                className="w-8 h-4 rounded-full relative transition-colors shrink-0"
                style={{ backgroundColor: applyToAll ? btnBg : isDarkNav ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', boxShadow: applyToAll ? `0 0 10px ${btnBg}80` : 'none' }}
                title="Apply style changes to all plots in layout"
              >
                <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${applyToAll ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </ConfigProvider>
      );
    }

    return (
      <ConfigProvider theme={antdTheme}>
        <div className="flex items-center gap-4 shrink-0">
          {(showStrokeUI || showTextUI) && (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-[11px] font-medium" style={{ color: headerSubText }}>
                {isTextMode ? 'Text Size:' : 'Stroke Size:'}
              </span>
              <input 
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={currentSizeVal}
                onChange={(e) => {
                   const raw = e.target.value;
                   if (isTextMode) {
                     onTextFontSizeChange(raw === '' ? '' : parseFloat(raw)); 
                   } else {
                     onStrokeWidthChange(raw === '' ? '' : parseFloat(raw));
                   }
                }}
                onBlur={(e) => {
                   const v = parseFloat(e.target.value);
                   if (isNaN(v) || v < 0.1) {
                     if (isTextMode) {
                       onTextFontSizeChange(2);
                     } else {
                       onStrokeWidthChange(2);
                     }
                   }
                }}
                className="w-14 h-7 border rounded px-2 text-[11px] focus:outline-none transition-colors font-mono"
                style={inputStyle}
                title={isTextMode ? 'Text Size' : 'Stroke Size'}
              />
            </div>
          )}
          
          {showStrokeUI && !isTextMode && (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-[11px] font-medium" style={{ color: headerSubText }}>Color:</span>
              <ColorPicker
                value={selectedShape ? selectedShape.attributes?.stroke : strokeColor}
                onChange={(color, hex) => {
                  const finalHex = typeof hex === 'string' ? hex : (typeof color === 'string' ? color : color.toHexString());
                  onStrokeColorChange(finalHex);
                }}
                size="small"
                showText
                format="hex"
                styles={{ popup: { zIndex: 9999, touchAction: 'none' } }}
              />
            </div>
          )}

          {showStrokeUI && !isTextMode && (
            <div className="flex items-center">
              <button 
                onClick={onToggleApplyToAllAnnotations}
                className="relative w-7 h-4 rounded-full transition-colors border border-transparent hover:border-gray-500/50"
                style={{ backgroundColor: applyToAllAnnotations ? btnBg : isDarkNav ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', boxShadow: applyToAllAnnotations ? `0 0 10px ${btnBg}80` : 'none' }}
                title="Apply style changes to all annotations in layout"
              >
                <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${applyToAllAnnotations ? 'left-[14px]' : 'left-0.5'}`} />
              </button>
            </div>
          )}
          
          {showTextUI && (
            <>
              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-[11px] font-medium" style={{ color: headerSubText }}>Color:</span>
                <ColorPicker
                  value={selectedShape ? selectedShape.attributes?.fill : textFontColor}
                  onChange={(_, hex) => onTextFontColorChange(hex)}
                  size="small"
                  showText
                  format="hex"
                  styles={{ popup: { zIndex: 9999 } }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-[11px] font-medium" style={{ color: headerSubText }}>Font:</span>
                <select
                  value={selectedShape ? selectedShape.attributes?.['font-family'] : textFontFamily}
                  onChange={(e) => onTextFontFamilyChange(e.target.value)}
                  className="h-7 border rounded px-2 text-[11px] focus:outline-none transition-colors"
                  style={inputStyle}
                  title="Font"
                >
                  <option value="sans-serif">Sans Serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>
            </>
          )}
        </div>
      </ConfigProvider>
    );
  };

  return (
    <div className="flex flex-col shrink-0 z-20 shadow-xl border-b border-black/5" style={{ backgroundColor: headerBg }}>
      <header className="h-14 backdrop-blur-md flex items-center justify-between px-2 md:px-6 relative" style={{ backgroundColor: isDarkNav ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }}>
        <div className="flex items-center gap-2 md:gap-4">
          <Link href={backUrl} className="transition-colors flex items-center gap-1 text-sm font-medium hover:opacity-80" style={{ color: headerSubText }}>
            <ChevronLeft size={16} />
            <span className="hidden md:inline font-bold uppercase tracking-wider text-xs">Back</span>
          </Link>
          <div className="hidden md:block w-px h-5" style={{ backgroundColor: isDarkNav ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
          <div className="hidden md:flex items-center gap-2">
            <div className="text-sm font-bold truncate max-w-[120px] lg:max-w-xs uppercase tracking-wider" style={{ color: headerText }} title={conversionName}>
              {conversionName || 'Unnamed CAD'}
            </div>
          </div>
          
          <div className="hidden md:flex items-center">
            <div className="w-px h-5 mx-2" style={{ backgroundColor: isDarkNav ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
            {ToolSettings()}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
        <div className="flex items-center gap-2 md:mr-2">
          <span className="hidden md:inline text-xs font-bold uppercase tracking-wider" style={{ color: headerSubText }}>Plot Status</span>
          <button 
            onClick={onTogglePlotStatus}
            className="w-8 h-4 rounded-full relative transition-colors shrink-0"
            style={{ backgroundColor: showPlotStatus ? btnBg : isDarkNav ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', boxShadow: showPlotStatus ? `0 0 10px ${btnBg}80` : 'none' }}
          >
            <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${showPlotStatus ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 md:gap-4">
          <div className="flex items-center gap-0.5 md:gap-2 border rounded-lg p-0.5 md:p-1" style={inputStyle}>
            <button 
              className="p-1.5 hover:opacity-100 opacity-70 disabled:opacity-30 transition-opacity" 
              style={{ color: btnBg }}
              title="Undo (Ctrl+Z)"
              onClick={onUndo}
              disabled={!canUndo}
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4" style={{ backgroundColor: btnBg, opacity: 0.3 }} />
            <button 
              className="p-1.5 hover:opacity-100 opacity-70 disabled:opacity-30 transition-opacity" 
              style={{ color: btnBg }}
              title="Redo (Ctrl+Y)"
              onClick={onRedo}
              disabled={!canRedo}
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center min-w-[24px] md:min-w-[32px] h-6 md:h-8 border rounded-lg transition-all opacity-80 hover:opacity-100"
            style={inputStyle}
            title="Refresh Page"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center justify-center min-w-[44px] md:min-w-[72px] h-6 md:h-8 rounded-lg text-[10px] md:text-xs font-bold tracking-wider transition-all disabled:opacity-50"
            style={{ backgroundColor: btnBg, color: btnText, boxShadow: `0 0 15px ${btnBg}4d` }}
          >
            {isSaving ? '...' : 'SAVE'}
          </button>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs font-mono font-medium px-3 py-1.5 rounded-lg border" style={{ color: headerSubText, backgroundColor: isDarkNav ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)', borderColor: isDarkNav ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
          <div className="flex gap-2">
            <span>X: {coords.x.toFixed(2)}</span>
            <span>Y: {coords.y.toFixed(2)}</span>
          </div>
          <div className="w-px h-4" style={{ backgroundColor: isDarkNav ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
          <div className="w-12 text-right">{Math.round(zoomPercent)}%</div>
          <button className="p-1 hover:opacity-80 transition-opacity ml-1 shrink-0" style={{ color: btnBg }} title="Fit to Screen" onClick={() => window.dispatchEvent(new CustomEvent('editor-fit-screen'))}>
            <Maximize size={14} />
          </button>
        </div>
        
        <button 
          onClick={onToggleMobileSidebar}
          className="md:hidden p-1 -mr-1 rounded transition-colors shrink-0 opacity-70 hover:opacity-100"
          style={{ color: headerText }}
          title="Toggle Properties"
          aria-label="Toggle sidebar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
      </div>
      </header>
      
      {/* Mobile Tool Settings Row */}
      {(showStrokeUI || showTextUI || isPlotMode) && (
        <div className={`md:hidden flex items-center h-10 px-2 pb-1 border-t overflow-x-auto whitespace-nowrap ${(!isTextMode && !isPlotMode) ? 'justify-center w-full' : ''}`} style={{ backgroundColor: headerBg, borderColor: isDarkNav ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
          {ToolSettings()}
        </div>
      )}
    </div>
  );
}
