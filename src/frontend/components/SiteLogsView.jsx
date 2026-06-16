import React from 'react';
import { Plus, Camera, MapPin, Clock } from 'lucide-react';

const statusBadge = {
  active: 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40',
  paused: 'bg-amber-950/20 text-amber-400 border-amber-900/40',
  inspection: 'bg-purple-950/20 text-purple-400 border-purple-900/40',
  completed: 'bg-slate-800 text-slate-400 border-slate-700',
};

export default function SiteLogsView({
  siteLogs,
  isClient,
  setShowSiteLogModal,
  projects,
}) {
  const getProjectName = (id) => projects?.find(p => p.id === id)?.name || 'Unknown Project';

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Site Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5">Chronological record of site visits, progress and photos.</p>
        </div>
        {!isClient && (
          <button
            onClick={() => setShowSiteLogModal(true)}
            className="flex items-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-all cursor-pointer shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Site Log
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="relative border-l-2 border-slate-800 pl-6 ml-3 space-y-6">
        {siteLogs.map((log) => (
          <div key={log.id} className="relative">
            {/* Timeline dot */}
            <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-slate-900 border-2 border-blue-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm space-y-4 hover:border-slate-700 transition-all">
              {/* Log Header */}
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    {new Date(log.created_at || Date.now()).toLocaleDateString('en-GB', {
                      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                    })} · {new Date(log.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <h4 className="text-sm font-extrabold text-white mt-1">
                    {log.created_by_name || 'Site Engineer'}
                  </h4>
                  {log.project_id && (
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                      <MapPin className="w-3 h-3" />
                      {getProjectName(log.project_id)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {log.site_status && (
                    <span className={`text-[8px] px-2 py-0.5 font-bold uppercase rounded border ${statusBadge[log.site_status] || statusBadge.active}`}>
                      {log.site_status}
                    </span>
                  )}
                </div>
              </div>

              {/* Notes */}
              <p className="text-xs text-slate-300 leading-relaxed">{log.notes}</p>

              {/* Photos Grid */}
              {log.photos && log.photos.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    <Camera className="w-3 h-3" />
                    {log.photos.length} Photo{log.photos.length > 1 ? 's' : ''}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {log.photos.map((photoUrl, pIdx) => (
                      <a
                        key={pIdx}
                        href={photoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-24 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group relative block"
                      >
                        <img
                          src={photoUrl}
                          alt={`Site photo ${pIdx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white">View</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {siteLogs.length === 0 && (
          <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/20 flex flex-col items-center gap-3">
            <Camera className="w-10 h-10 text-slate-700" />
            <div>
              <p className="text-sm font-bold text-slate-600">No site logs yet</p>
              <p className="text-xs text-slate-700 mt-1">
                {!isClient ? 'Record your first site visit to start tracking progress.' : 'No site updates available.'}
              </p>
            </div>
            {!isClient && (
              <button
                onClick={() => setShowSiteLogModal(true)}
                className="flex items-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add First Log
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
