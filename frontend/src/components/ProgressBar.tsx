import React from 'react';

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
        <span>CONVERTER PROGRESS:</span>
        <span style={{ color: 'var(--neon-primary)' }}>{Math.floor(progress)}%</span>
      </div>
      <div className="bg-black border border-slate-800 p-0.5">
        <div 
          className="h-2 transition-all duration-100" 
          style={{ 
            width: `${progress}%`, 
            background: 'var(--neon-primary)', 
            boxShadow: '0 0 6px var(--neon-glow)' 
          }}
        />
      </div>
    </div>
  );
}
