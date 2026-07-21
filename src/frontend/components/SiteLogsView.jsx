import React, { useState, useEffect } from 'react';

const STATUS_BADGE_STYLES = {
  active: 'bg-success/10 text-success border border-success/20',
  paused: 'bg-warning/10 text-warning border border-warning/20',
  inspection: 'bg-primary/10 text-primary border border-primary/20',
  completed: 'bg-secondary/15 text-secondary border border-border-subtle',
};

const getInitials = (name = '') => {
  if (!name) return 'SE';
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getAvatarColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-primary-container text-white',
    'bg-secondary-container text-on-secondary-container',
    'bg-tertiary-container text-white',
    'bg-secondary-fixed text-on-secondary-fixed',
    'bg-primary-fixed text-primary',
  ];
  return colors[Math.abs(hash) % colors.length];
};

const extractStoragePath = (urlOrPath) => {
  if (!urlOrPath || typeof urlOrPath !== 'string' || urlOrPath.startsWith('blob:')) return null;
  if (!urlOrPath.startsWith('http')) return urlOrPath;
  const bucketMarker = '/keystone-assets/';
  const idx = urlOrPath.indexOf(bucketMarker);
  if (idx !== -1) {
    let clean = urlOrPath.substring(idx + bucketMarker.length);
    const qIdx = clean.indexOf('?');
    if (qIdx !== -1) {
      clean = clean.substring(0, qIdx);
    }
    return clean || null;
  }
  return null;
};

export default function SiteLogsView({
  siteLogs = [],
  isClient,
  setShowSiteLogModal,
  projects = [],
  getSignedUrl,
}) {
  const [previewPhoto, setPreviewPhoto] = useState(null);
  // Map: logId -> array of resolved display URLs (signed URLs for private paths, raw otherwise)
  const [resolvedPhotos, setResolvedPhotos] = useState({});

  const getProjectName = (id) => projects?.find(p => p.id === id)?.name || 'Unknown Project';

  // Resolve signed URLs for all site log photos that are private storage paths
  useEffect(() => {
    if (!getSignedUrl || siteLogs.length === 0) return;
    let cancelled = false;

    const resolveAll = async () => {
      const result = {};
      for (const log of siteLogs) {
        const photoObjects = log.photoObjects || (log.photos || []).map(url => ({
          url,
          storagePath: extractStoragePath(url)
        }));

        if (photoObjects.length === 0) continue;

        const resolved = await Promise.all(
          photoObjects.map(async (photo) => {
            const stPath = photo.storagePath || extractStoragePath(photo.url);
            if (stPath) {
              const signed = await getSignedUrl(stPath);
              if (signed) return signed;
            }
            return photo.url;
          })
        );

        if (!cancelled) {
          result[log.id] = resolved;
        }
      }
      if (!cancelled) {
        setResolvedPhotos(result);
      }
    };

    resolveAll();
    return () => { cancelled = true; };
  }, [siteLogs, getSignedUrl]);

  return (
    <div className="space-y-8 animate-fade-in text-on-surface">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-label-md text-secondary mb-2">
            <span>Projects</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Site Activities</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-semibold">Logs</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-ink-black font-bold tracking-tight">
            Site Activities Timeline
          </h2>
          <p className="text-body-md text-secondary mt-1 font-medium">
            Chronological record of site visits, progress audits, and field photographs.
          </p>
        </div>
        {!isClient && (
          <button
            onClick={() => setShowSiteLogModal(true)}
            className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-container transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer text-body-md"
          >
            <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
            Add Site Update
          </button>
        )}
      </div>

      {/* Dashboard Bento Summary */}
      <div className="grid grid-cols-12 gap-6">
        {/* Project Health Overview */}
        <div className="col-span-12 md:col-span-8 bg-surface-container-lowest p-6 rounded-xl border border-border-subtle flex flex-col justify-between shadow-sm">
          <div>
            <p className="text-label-md text-secondary uppercase tracking-wider font-bold mb-4">
              Project Health Overview
            </p>
            <div className="flex flex-wrap items-center gap-8 md:gap-12">
              <div>
                <span className="block text-headline-lg text-ink-black font-bold">84%</span>
                <span className="text-label-md text-secondary font-medium">Completion Phase 1</span>
              </div>
              <div className="h-10 w-px bg-border-subtle hidden sm:block"></div>
              <div>
                <span className="block text-headline-lg text-success font-bold">On Track</span>
                <span className="text-label-md text-secondary font-medium">Schedule Status</span>
              </div>
              <div className="h-10 w-px bg-border-subtle hidden sm:block"></div>
              <div>
                <span className="block text-headline-lg text-ink-black font-bold">12</span>
                <span className="text-label-md text-secondary font-medium">Active Field Staff</span>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border-subtle flex items-center justify-between">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-primary-container text-[10px] flex items-center justify-center text-white font-bold">
                MK
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-secondary-container text-[10px] flex items-center justify-center text-primary font-bold">
                JD
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-tertiary-container text-[10px] flex items-center justify-center text-white font-bold">
                SA
              </div>
            </div>
            <span className="text-label-md text-primary font-bold cursor-pointer hover:underline">
              + 8 more monitoring
            </span>
          </div>
        </div>

        {/* Weather Card */}
        <div className="col-span-12 md:col-span-4 bg-ink-black p-6 rounded-xl text-white flex flex-col justify-between relative overflow-hidden shadow-md min-h-[180px]">
          <div className="relative z-10">
            <p className="text-label-sm text-slate-400 uppercase tracking-widest font-bold mb-1">
              Weather at Site
            </p>
            <h3 className="text-headline-md font-bold">Dubai, UAE</h3>
          </div>
          <div className="flex items-end justify-between relative z-10">
            <div>
              <span className="text-headline-lg block font-bold">32°C</span>
              <p className="text-label-md text-slate-300 font-medium">Clear Sky • High UV</p>
            </div>
            <span
              className="material-symbols-outlined text-[56px] text-warning select-none"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
            >
              wb_sunny
            </span>
          </div>
          {/* SVG background grid lines */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <line stroke="white" strokeWidth="0.1" x1="0" x2="100" y1="20" y2="20"></line>
              <line stroke="white" strokeWidth="0.1" x1="0" x2="100" y1="40" y2="40"></line>
              <line stroke="white" strokeWidth="0.1" x1="0" x2="100" y1="60" y2="60"></line>
              <line stroke="white" strokeWidth="0.1" x1="0" x2="100" y1="80" y2="80"></line>
            </svg>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="relative pl-0 md:pl-4">
        {[...siteLogs].sort((a, b) => new Date(b.visit_date || b.created_at || 0) - new Date(a.visit_date || a.created_at || 0)).map((log, index, arr) => {
          const isLast = index === arr.length - 1;
          const initials = getInitials(log.created_by_name);
          const colorClass = getAvatarColor(log.created_by_name || 'Site Engineer');
          const logDateObj = new Date(log.visit_date || log.created_at || Date.now());

          return (
            <div
              key={log.id}
              className={`relative pl-12 pb-12 ${
                isLast ? 'last-entry' : 'timeline-line'
              }`}
            >
              {/* Timeline Icon */}
              <div className="absolute left-0 top-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-md z-10 select-none">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  history
                </span>
              </div>

              {/* Log entry panel */}
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                {/* Date Side column */}
                <div className="md:w-32 shrink-0 pt-2">
                  <span className="text-label-md font-bold text-ink-black block">
                    {index === 0 ? 'Latest Update' : 'Site Audit'}
                  </span>
                  <span className="text-label-sm text-secondary font-medium">
                    {logDateObj.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Main Card */}
                <div className="flex-1 bg-surface-container-lowest border border-border-subtle rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${colorClass}`}>
                        {initials}
                      </div>
                      <div>
                        <h4 className="text-body-md font-bold text-ink-black">{log.created_by_name || 'Site Engineer'}</h4>
                        <p className="text-label-sm text-secondary font-medium">
                          {log.project_id ? getProjectName(log.project_id) : 'General Site Update'} ·{' '}
                          {logDateObj.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    {log.site_status && (
                      <span className={`px-3 py-1 rounded-full text-label-sm font-bold capitalize ${STATUS_BADGE_STYLES[log.site_status] || STATUS_BADGE_STYLES.active}`}>
                        {log.site_status}
                      </span>
                    )}
                  </div>

                  <p className="text-body-md text-secondary leading-relaxed mb-6 font-medium">
                    {log.notes}
                  </p>

                  {/* Location-ready Metadata Pills */}
                  {(log.location || log.weather || log.workers_count != null) && (
                    <div className="flex flex-wrap items-center gap-3 mb-5 pt-3 border-t border-border-subtle/50 text-xs">
                      {log.location && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface rounded-md border border-border-subtle text-secondary font-semibold">
                          <span className="material-symbols-outlined text-[15px] text-primary">location_on</span>
                          {log.location}
                        </span>
                      )}
                      {log.weather && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface rounded-md border border-border-subtle text-secondary font-semibold">
                          <span className="material-symbols-outlined text-[15px] text-amber-500">wb_sunny</span>
                          {log.weather}
                        </span>
                      )}
                      {log.workers_count != null && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface rounded-md border border-border-subtle text-secondary font-semibold">
                          <span className="material-symbols-outlined text-[15px] text-indigo-500">engineering</span>
                          {log.workers_count} {log.workers_count === 1 ? 'Worker' : 'Workers'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Photo Grid */}
                  {log.photos && log.photos.length > 0 && (() => {
                    // Use resolved (signed) URLs if available; otherwise fall back to raw URL (may be expiring or full http URL)
                    const displayUrls = resolvedPhotos[log.id] || log.photos;
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {displayUrls.map((photoUrl, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setPreviewPhoto(photoUrl)}
                            className="aspect-video bg-surface-container rounded-lg overflow-hidden relative group border border-border-subtle block w-full cursor-pointer focus:outline-none"
                          >
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={`Site photo ${pIdx + 1}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                              />
                            ) : null}
                            <div className={`${photoUrl ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center bg-surface-container`}>
                              <span className="material-symbols-outlined text-secondary text-[24px]">image_not_supported</span>
                            </div>
                            <div className="absolute inset-0 bg-ink-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="material-symbols-outlined text-white">zoom_in</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })}

        {siteLogs.length === 0 && (
          <div className="py-16 text-center border border-dashed border-border-subtle rounded-xl bg-surface-container-low/30 flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[40px] text-secondary">add_a_photo</span>
            <div>
              <p className="text-sm font-bold text-on-surface">No site activity logs found</p>
              <p className="text-xs text-secondary mt-1">
                {!isClient ? 'Record your first site visit to start tracking progress.' : 'No site updates available.'}
              </p>
            </div>
            {!isClient && (
              <button
                onClick={() => setShowSiteLogModal(true)}
                className="flex items-center gap-2 py-2 px-4 rounded-lg bg-primary hover:bg-primary-container text-xs font-bold text-white transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                Add First Log
              </button>
            )}
          </div>
        )}

        {/* Photo Preview Lightbox Modal */}
        {previewPhoto && (
          <div
            className="fixed inset-0 z-50 bg-ink-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setPreviewPhoto(null)}
          >
            <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="absolute -top-12 right-0 text-white hover:text-slate-300 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
              <img
                src={previewPhoto}
                alt="Site photo preview"
                className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
