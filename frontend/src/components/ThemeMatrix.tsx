import React from 'react';

export function ThemeMatrix({ logToConsole }: { logToConsole: (msg: string, type: 'normal' | 'success' | 'info' | 'warning' | 'error') => void }) {
  const setSkin = (skinName: string) => {
    document.body.className = document.body.className.replace(/skin-\S+/g, '').trim();
    document.body.classList.add(`skin-${skinName}`);
    document.cookie = `skin=${skinName}; path=/; max-age=31536000`;
    const skinNames: Record<string, string> = {
      'hacker-blue': 'HACKER CYAN',
      'matrix-green': 'PHOSPHOR GREEN',
      'cyber-magenta': 'CYBER MAGENTA',
      'classic-gray': 'MONO CLASSIC'
    };
    logToConsole(`Applied theme: ${skinNames[skinName] || skinName.toUpperCase()}`, 'normal');
  };

  return (
    <div className="md:col-span-8 cyber-box p-3 space-y-3">
        <div className="cyber-header px-2 py-0.5 text-xs text-slate-400">_TERM_COLOR_MATRIX</div>
        <p className="text-[11px] text-slate-500">Inject color matrices directly to the layout (saves to cookie):</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button type="button" onClick={() => setSkin('hacker-blue')} className="border border-cyan-400/40 hover:border-cyan-400 bg-black p-2 flex flex-col items-center justify-center transition">
                <div className="w-4 h-4 bg-cyan-400 mb-1 border border-white"></div>
                <span className="text-[9px] text-cyan-400">HACKER CYAN</span>
            </button>
            <button type="button" onClick={() => setSkin('matrix-green')} className="border border-emerald-500/40 hover:border-emerald-500 bg-black p-2 flex flex-col items-center justify-center transition">
                <div className="w-4 h-4 bg-emerald-500 mb-1 border border-white"></div>
                <span className="text-[9px] text-emerald-500">PHOSPHOR GREEN</span>
            </button>
            <button type="button" onClick={() => setSkin('cyber-magenta')} className="border border-pink-500/40 hover:border-pink-500 bg-black p-2 flex flex-col items-center justify-center transition">
                <div className="w-4 h-4 bg-pink-500 mb-1 border border-white"></div>
                <span className="text-[9px] text-pink-500">CYBER MAGENTA</span>
            </button>
            <button type="button" onClick={() => setSkin('classic-gray')} className="border border-slate-500/40 hover:border-slate-500 bg-black p-2 flex flex-col items-center justify-center transition">
                <div className="w-4 h-4 bg-slate-300 mb-1 border border-white"></div>
                <span className="text-[9px] text-slate-300">MONO CLASSIC</span>
            </button>
        </div>
    </div>
  );
}
