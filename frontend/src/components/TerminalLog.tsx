import React, { forwardRef } from 'react';

type TerminalLogProps = {
  logs: { msg: string, type: string }[];
};

export const TerminalLog = forwardRef<HTMLDivElement, TerminalLogProps>(({ logs }, ref) => {
  return (
    <div className="border border-slate-800 bg-[#040609] p-3 font-mono text-[11px] h-40 overflow-y-auto space-y-1 scanlines" ref={ref}>
      {logs.map((log, i) => {
        let colorClass = 'text-slate-500';
        if (log.type === 'success') colorClass = 'text-emerald-400 font-bold';
        if (log.type === 'info') colorClass = 'text-blue-400';
        if (log.type === 'warning') colorClass = 'text-yellow-400 font-bold';
        if (log.type === 'error') colorClass = 'text-red-500 font-bold';
        return (
          <div key={i} className={colorClass}>&gt; {log.msg}</div>
        );
      })}
    </div>
  );
});

TerminalLog.displayName = 'TerminalLog';
