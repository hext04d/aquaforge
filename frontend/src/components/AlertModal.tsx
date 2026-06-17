import React from 'react';

export function AlertModal({ alertInfo, onClose }: { alertInfo: { title: string, text: string } | null, onClose: () => void }) {
  if (!alertInfo) return null;

  return (
    <div id="retroNotification" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="cyber-box w-full max-w-md p-0 border border-red-500 shadow-2xl">
        <div className="flex items-center justify-between bg-red-950 text-red-400 border-b border-red-500 px-3 py-1 font-bold">
          <span id="retroAlertTitle">{alertInfo.title}</span>
          <button onClick={onClose} className="hover:bg-red-500 hover:text-black px-1.5 transition">X</button>
        </div>
        <div className="p-4 bg-black space-y-4">
          <div className="flex items-start space-x-3">
            <span className="text-red-500 text-2xl blink font-bold">⚠️</span>
            <pre id="retroAlertText" className="text-xs font-mono text-red-400 break-all whitespace-pre-wrap pt-1">{alertInfo.text}</pre>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={onClose} className="cyber-btn px-6 py-1 text-xs" style={{ borderColor: '#ff003c', color: '#ff003c' }}>ACKNOWLEDGE</button>
          </div>
        </div>
      </div>
    </div>
  );
}
