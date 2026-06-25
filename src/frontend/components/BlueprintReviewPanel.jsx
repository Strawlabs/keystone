import React from 'react';
import { ZoomOut, ZoomIn, MessageSquare, X } from 'lucide-react';

export default function BlueprintReviewPanel({
  activeDrawing,
  zoomScale,
  setZoomScale,
  drawingContainerRef,
  handleBlueprintClick,
  blueprintPins,
  clickCoords,
  isClient,
  handleClientApprovalAction,
  newPinComment,
  setNewPinComment,
  submitPinComment,
  setClickCoords
}) {
  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Blueprint Board Container */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col min-h-[500px]">
          
          {/* Drawing Viewer Toolbar */}
          <div className="bg-slate-950 p-4 border-b border-slate-850 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white truncate max-w-xs">{activeDrawing?.name || 'Review Board Floor Plan'}</h3>
              <p className="text-[9px] text-slate-500 truncate mt-0.5">Project: {activeDrawing?.project_name || 'strawlabs'}</p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-905 p-1.5 rounded-lg border border-slate-800 select-none">
              <button 
                onClick={() => setZoomScale(Math.max(0.5, zoomScale - 0.25))}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono text-slate-350 px-2 min-w-[48px] text-center">{zoomScale * 100}%</span>
              <button 
                onClick={() => setZoomScale(Math.min(2, zoomScale + 0.25))}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawing Clickable Map Canvas */}
          <div className="flex-1 overflow-auto relative blueprint-grid flex items-center justify-center p-8 min-h-[400px]">
            <div 
              ref={drawingContainerRef}
              onClick={handleBlueprintClick}
              className="relative border-2 border-dashed border-blue-500/20 max-w-full shadow-2xl cursor-crosshair select-none transition-transform duration-150"
              style={{ 
                transform: `scale(${zoomScale})`, 
                backgroundImage: `url('${activeDrawing?.file_url || "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1000"}')`,
                backgroundSize: 'cover',
                width: '600px',
                height: '400px'
              }}
            >
              <div className="absolute inset-0 bg-blue-950/20 mix-blend-overlay pointer-events-none"></div>

              {/* Display Dropped Pins */}
              {blueprintPins.map((pin, index) => (
                <div
                  key={pin.id}
                  className="absolute w-6 h-6 rounded-full bg-blue-605 border-2 border-white flex items-center justify-center text-[10px] font-extrabold text-white shadow-lg shadow-blue-500/30 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  title={`${pin.user} (${pin.role}): ${pin.comment}`}
                >
                  {index + 1}
                  
                  {/* Mini Tooltip on Hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 border border-slate-800 p-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-[9px] text-slate-350 leading-snug">
                    <span className="font-extrabold text-white block mb-0.5">{pin.user} ({pin.role.toUpperCase()})</span>
                    {pin.comment}
                  </div>
                </div>
              ))}

              {/* Temporary indicator during click */}
              {clickCoords && (
                <div
                  className="absolute w-6 h-6 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-xs text-white shadow-xl -translate-x-1/2 -translate-y-1/2 animate-ping"
                  style={{ left: `${clickCoords.x}%`, top: `${clickCoords.y}%` }}
                />
              )}
            </div>
          </div>

          {/* Blueprint Review Action Footer */}
          {isClient && (
            <div className="bg-slate-950 p-4 border-t border-slate-850 flex items-center justify-between gap-4">
              <p className="text-[10px] text-slate-550 leading-snug max-w-md">
                Review the blueprint. Click anywhere on the drawing layout to place a comment tag before approving or requesting revisions.
              </p>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleClientApprovalAction('revision_requested')}
                  className="py-2 px-4 rounded-lg bg-amber-500/10 border border-amber-905 hover:bg-amber-500 hover:text-slate-950 text-xs font-bold text-amber-405 transition-all cursor-pointer"
                >
                  Request Revision
                </button>
                <button 
                  onClick={() => handleClientApprovalAction('approved')}
                  className="py-2 px-6 rounded-lg bg-emerald-650 hover:bg-emerald-700 text-xs font-bold text-white transition-all shadow-lg shadow-emerald-500/15 cursor-pointer"
                >
                  Approve Blueprint
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Comments / Pins Panel */}
        <div className="w-full lg:w-80 bg-slate-900 border border-slate-805 rounded-2xl p-5 shadow-xl flex flex-col justify-between shrink-0 space-y-4">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white border-b border-slate-800 pb-2.5 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-550" />
              <span>Blueprint Review Feed</span>
            </h3>

            {/* Scrollable list of comments */}
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1.5">
              {blueprintPins.map((pin, idx) => (
                <div key={pin.id} className="p-3 bg-slate-955/40 border border-slate-850 rounded-xl flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-350 shrink-0 mt-0.5">{idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center gap-1">
                      <span className="text-[10px] font-bold text-white truncate">{pin.user}</span>
                      <span className="text-[8px] bg-slate-850 px-1 py-0.5 rounded text-slate-500 font-extrabold uppercase shrink-0">{pin.role}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">{pin.comment}</p>
                  </div>
                </div>
              ))}
              {blueprintPins.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6">No comment pins dropped yet.</p>
              )}
            </div>
          </div>

          {/* Comment Add Panel */}
          {clickCoords ? (
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-extrabold text-blue-450 uppercase tracking-widest">Pin Drop Active</span>
                <button onClick={() => setClickCoords(null)} className="text-slate-500 hover:text-slate-350 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
              </div>
              <textarea
                rows={2}
                value={newPinComment}
                onChange={(e) => setNewPinComment(e.target.value)}
                placeholder="Add review remark..."
                className="w-full text-xs p-2 bg-slate-900 border border-slate-800 rounded focus:outline-none text-slate-200"
              />
              <button 
                onClick={submitPinComment}
                className="w-full py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-[10px] font-bold text-white transition-colors cursor-pointer"
              >
                Drop Tag Pin
              </button>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-950/20 border border-dashed border-slate-800 rounded-xl text-center text-[10px] text-slate-500 leading-normal">
              Click any point on the blueprint viewer canvas to drop a tagged correction pin.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
