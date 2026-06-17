"use client";

import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp3");
  const [quality, setQuality] = useState("best");

  const [logs, setLogs] = useState<{ msg: string, type: string }[]>([
    { msg: "Input video stream link and click [START DOWNLOAD PROCESS] below.", type: "normal" }
  ]);

  const [systemState, setSystemState] = useState<"standby" | "active" | "complete" | "error">("standby");
  const [progress, setProgress] = useState(0);
  const [apiStatus, setApiStatus] = useState<"ONLINE" | "OFFLINE" | "CHECKING">("CHECKING");

  const [alertInfo, setAlertInfo] = useState<{ title: string, text: string } | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cursor sparkle animation trail
    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() > 0.85) {
        const sparkle = document.createElement('div');
        sparkle.className = 'cursor-sparkle';
        sparkle.style.left = `${e.pageX}px`;
        sparkle.style.top = `${e.pageY}px`;
        document.body.appendChild(sparkle);

        setTimeout(() => {
          sparkle.style.transition = 'all 0.4s ease';
          sparkle.style.opacity = '0';
          sparkle.style.transform = 'translateY(15px) scale(0.3)';
          setTimeout(() => sparkle.remove(), 400);
        }, 100);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    // API Health Check
    const checkApi = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.port === '3000' ? 'http://localhost:5000' : '');
        const res = await fetch(`${baseUrl}/api/health`);
        if (res.ok) setApiStatus("ONLINE");
        else setApiStatus("OFFLINE");
      } catch (e) {
        setApiStatus("OFFLINE");
      }
    };
    checkApi();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  const logToConsole = (msg: string, type: 'normal' | 'success' | 'info' | 'warning' | 'error' = 'normal') => {
    setLogs(prev => [...prev, { msg, type }]);
  };

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startFakeProgress = () => {
    setProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    let step = 0;
    progressIntervalRef.current = setInterval(() => {
      if (step < 90) {
        step += Math.random() * 5;
        if (step > 90) step = 90;
        setProgress(step);
      }
    }, 500);
  };

  const completeProgress = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setProgress(100);
  };

  const downloadSingleVideo = async (videoUrl: string, baseUrl: string, fmt: string, q: string) => {
    const response = await fetch(`${baseUrl}/api/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: videoUrl, format: fmt, quality: q })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to download video');
    }

    logToConsole('SHREDDING SYSTEM FILE HEADERS AND WRITING TO DISK...', 'normal');

    const blob = await response.blob();
    let filename = 'download';
    const disposition = response.headers.get('Content-Disposition');
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    await new Promise(resolve => setTimeout(resolve, 500));
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();

    logToConsole(`ARCHIVE EXPORTED TO DISK: ${filename}`, 'warning');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setAlertInfo({ title: 'STREAM FAULT', text: 'No source link URL discovered in input stream. Paste valid target addresses into buffer [0x01].' });
      return;
    }

    setSystemState('active');
    logToConsole(`MOUNTING DOWNLOAD PIPELINE FOR LINK: ${url}`, 'info');
    startFakeProgress();

    try {
      // In Docker with Nginx, backend is at /api or we can hardcode for local dev if needed
      // We'll use process.env.NEXT_PUBLIC_API_URL if set, otherwise relative URL which works under Nginx, or absolute for local.
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.port === '3000' ? 'http://localhost:5000' : '');

      logToConsole('EXTRACTING METADATA PROTOCOLS...', 'normal');

      const infoRes = await fetch(`${baseUrl}/api/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });

      if (!infoRes.ok) {
        const err = await infoRes.json();
        throw new Error(err.error || 'Failed to fetch video info');
      }

      const info = await infoRes.json();

      if (!info.is_playlist) {
        logToConsole(`TARGET ACQUIRED: ${info.title}`, 'success');
        logToConsole(`ESTABLISHING HIGH-SPEED PEER CHANNEL FOR [.${format.toUpperCase()}]...`, 'normal');
        await downloadSingleVideo(url.trim(), baseUrl, format, quality);
        logToConsole('DOWNLOAD COMPLETE! Check your browser downloads.', 'success');
      } else {
        const entries = info.entries || [];
        if (entries.length === 0) {
          throw new Error('Playlist is empty or could not be parsed.');
        }

        logToConsole(`PLAYLIST ACQUIRED: ${info.title} [${entries.length} items]`, 'success');

        let successCount = 0;
        let failCount = 0;

        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        setProgress(0);

        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          logToConsole(`[${i + 1}/${entries.length}] EXTRACTING: ${entry.title}...`, 'info');

          try {
            await downloadSingleVideo(entry.url, baseUrl, format, quality);
            successCount++;
            setProgress(((i + 1) / entries.length) * 100);
            logToConsole(`[${i + 1}/${entries.length}] SUCCESS!`, 'success');
          } catch (err: any) {
            logToConsole(`[${i + 1}/${entries.length}] FAILED: ${err.message}`, 'error');
            failCount++;
          }
        }

        if (failCount === 0) {
          logToConsole(`ALL ${successCount} PACKETS SUCCESSFULLY ACQUIRED!`, 'success');
        } else {
          logToConsole(`FINISHED: ${successCount} SUCCESS, ${failCount} FAULTS.`, 'warning');
        }
      }

      setUrl('');
      completeProgress();
      setSystemState('complete');

    } catch (error: any) {
      completeProgress();
      setSystemState('error');
      logToConsole(`SYSTEM EXCEPTION: ${error.message}`, 'error');
      setAlertInfo({ title: 'DOWNLOAD ERROR', text: error.message });
    }
  };

  const getLedStyle = () => {
    if (systemState === 'standby') return { background: 'transparent', boxShadow: 'none' };
    if (systemState === 'active') return { background: 'var(--neon-primary)', boxShadow: '0 0 8px var(--neon-glow)' };
    if (systemState === 'complete') return { background: '#10b981', boxShadow: '0 0 8px #10b981' };
    return { background: '#ef4444', boxShadow: '0 0 8px #ef4444' };
  };

  const getStatusText = () => {
    if (systemState === 'standby') return '';
    if (systemState === 'active') return 'EXTRACTING TARGET';
    if (systemState === 'complete') return 'DOWNLOAD COMPLETE';
    return 'SYSTEM FAULT';
  };

  const getDaemonText = () => {
    if (systemState === 'standby') return 'LISTENING';
    if (systemState === 'active') return 'PROCESSING';
    if (systemState === 'complete') return 'IDLE';
    return 'ERROR';
  };

  const setSkin = (skinName: string) => {
    document.body.className = document.body.className.replace(/skin-\S+/g, '').trim();
    document.body.classList.add(`skin-${skinName}`);
    document.cookie = `skin=${skinName}; path=/; max-age=31536000`;
    logToConsole(`Injected core CSS color dictionary: "${skinName.toUpperCase()}"`, 'normal');
  };

  return (
    <>
      {alertInfo && (
        <div id="retroNotification" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="cyber-box w-full max-w-md p-0 border border-red-500 shadow-2xl">
            <div className="flex items-center justify-between bg-red-950 text-red-400 border-b border-red-500 px-3 py-1 font-bold">
              <span id="retroAlertTitle">{alertInfo.title}</span>
              <button onClick={() => { setAlertInfo(null); }} className="hover:bg-red-500 hover:text-black px-1.5 transition">X</button>
            </div>
            <div className="p-4 bg-black space-y-4">
              <div className="flex items-start space-x-3">
                <span className="text-red-500 text-2xl blink font-bold">⚠️</span>
                <pre id="retroAlertText" className="text-xs font-mono text-red-400 break-all whitespace-pre-wrap pt-1">{alertInfo.text}</pre>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => { setAlertInfo(null); }} className="cyber-btn px-6 py-1 text-xs" style={{ borderColor: '#ff003c', color: '#ff003c' }}>ACKNOWLEDGE</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN PORTAL CONTAINER */}
      <div className="w-full max-w-4xl flex flex-col space-y-4 z-10 font-[family-name:var(--font-share-tech)]">

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

        <main className="flex flex-col space-y-4">

          <section className="cyber-box p-5 space-y-4 bg-[#0d1117]">
            <div className="cyber-header px-2 py-0.5 text-xs text-slate-400 flex justify-between items-center font-[family-name:var(--font-vt323)] text-xl">
              <span>// DOWNLOAD_AND_FORGE_DOCK</span>
            </div>

            <p className="text-xs text-slate-400">
              Paste target stream links below. Supports YouTube and various other domains.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500">[0x01] VIDEO STREAM SOURCE URL(S)</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder="Paste YouTube URL here, e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="w-full p-2 bg-black text-xs text-slate-300 border border-slate-800 font-mono focus:border-cyan-400 focus:outline-none focus:ring-0"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">[0x02] EXPORT PROFILE / CODEC</label>
                  <select
                    value={format}
                    onChange={(e) => { setFormat(e.target.value); }}
                    className="w-full p-2 bg-black text-xs text-slate-300 border border-slate-800 font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="mp3">MPEG Audio Layer-3 (.mp3)</option>
                    <option value="mp4">MPEG-4 Video (.mp4)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">[0x03] RESOLUTION / BITRATE PROFILE</label>
                  <select
                    value={quality}
                    onChange={(e) => { setQuality(e.target.value); }}
                    className="w-full p-2 bg-black text-xs text-slate-300 border border-slate-800 font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="best">Highest Quality Available</option>
                    <option value="worst">Fastest (Lowest Quality)</option>
                  </select>
                </div>
              </div>

              <div className="border border-slate-800 bg-[#040609] p-3 font-mono text-[11px] h-40 overflow-y-auto space-y-1 scanlines" ref={consoleRef}>
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

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>CONVERTER PROGRESS:</span>
                  <span style={{ color: 'var(--neon-primary)' }}>{Math.floor(progress)}%</span>
                </div>
                <div className="bg-black border border-slate-800 p-0.5">
                  <div className="h-2 transition-all duration-100" style={{ width: `${progress}%`, background: 'var(--neon-primary)', boxShadow: '0 0 6px var(--neon-glow)' }}></div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-1">
                <div className="flex items-center space-x-2">
                  {systemState !== 'standby' && (
                    <>
                      <span className="w-2.5 h-2.5 border border-slate-700" style={getLedStyle()}></span>
                      <span className="text-[10px] font-mono text-slate-500">{getStatusText()}</span>
                    </>
                  )}
                </div>
                <button type="submit" disabled={systemState === 'active'} className="cyber-btn px-8 py-2 text-xs font-bold tracking-widest flex justify-center items-center gap-2">
                  [ START DOWNLOAD PROCESS ]
                </button>
              </div>

            </form>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-12 cyber-box p-3 space-y-3">
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
          </div>

        </main>

        <footer className="cyber-box p-4 text-center space-y-3 bg-black">
          <p className="text-[10px] text-slate-600 leading-normal max-w-2xl mx-auto font-mono">
            Aquaforge is a web video downloader and converter. No unnecessary slop, only functionality.
          </p>
        </footer>

      </div>
    </>
  );
}
