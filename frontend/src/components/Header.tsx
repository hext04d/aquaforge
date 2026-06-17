import React from 'react';

export function Header({ apiStatus }: { apiStatus: string }) {
  return (
    <header className="cyber-box p-4 bg-black flex flex-col md:flex-row justify-between items-stretch gap-4 relative overflow-hidden">
      <div className="flex-1 flex flex-col justify-center">
        <pre className="text-[5px] sm:text-[7px] md:text-[9px] leading-tight select-none font-bold text-cyan-400 mb-2 font-[family-name:var(--font-share-tech)]" style={{ color: 'var(--neon-primary)' }}>
          {` █████╗  ██████╗ ██╗   ██╗  █████╗ ███████╗ ██████╗ ██████╗  ██████╗ ███████╗
██╔══██╗██╔═══██╗██║   ██║ ██╔══██╗██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
███████║██║   ██║██║   ██║ ███████║█████╗  ██║   ██║██████╔╝██║  ███╗█████╗  
██╔══██║██║▄▄ ██║██║   ██║ ██╔══██║██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝  
██║  ██║╚██████╔╝╚██████╔╝ ██║  ██║██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
╚═╝  ╚═╝ ╚══▀▀═╝  ╚═════╝  ╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝`}
        </pre>
      </div>

      <div className="cyber-box bg-black p-2.5 font-mono text-[10px] text-slate-400 w-fit min-w-[120px] flex flex-col justify-between" style={{ borderColor: 'var(--panel-border)' }}>
        <div>
          <div className="flex justify-between border-b border-dashed border-slate-800 pb-0.5 mb-1">
            <span>VERSION:</span> <span className="text-yellow-500">v1.2.4-STABLE</span>
          </div>
          <div className="flex justify-between">
            <span>API STATUS:</span>
            <span className={apiStatus === 'ONLINE' ? 'text-emerald-400' : apiStatus === 'CHECKING' ? 'text-slate-400' : 'text-red-500'}>
              {apiStatus}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
