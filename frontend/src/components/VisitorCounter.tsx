import React from 'react';

export function VisitorCounter({ visitorCount }: { visitorCount: number }) {
  return (
    <div className="md:col-span-4 cyber-box p-3 flex flex-col items-center justify-center bg-black/60">
        <h3 className="text-xs font-bold text-slate-500 mb-1">_VISIT_STREAM</h3>
        <div className="bg-black border border-slate-800 inline-block p-1">
            <span className="text-emerald-500 text-2xl font-bold tracking-widest px-2" style={{ fontFamily: '"VT323", monospace' }}>
                {visitorCount.toString().padStart(8, '0')}
            </span>
        </div>
    </div>
  );
}
