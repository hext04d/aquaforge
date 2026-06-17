"use client";

import { useState, useEffect, useRef } from "react";
import { checkHealth, fetchVisits, fetchVideoInfo, downloadVideoBlob } from "../services/api";
import { Header } from "../components/Header";
import { ThemeMatrix } from "../components/ThemeMatrix";
import { VisitorCounter } from "../components/VisitorCounter";
import { AlertModal } from "../components/AlertModal";
import { TerminalLog } from "../components/TerminalLog";
import { Footer } from "../components/Footer";
import { ProgressBar } from "../components/ProgressBar";

export default function Home() {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp3");
  const [audioQuality, setAudioQuality] = useState("320");
  const [videoQuality, setVideoQuality] = useState("1080");

  const [logs, setLogs] = useState<{ msg: string, type: string }[]>([
    { msg: "Input video stream link and click [START DOWNLOAD PROCESS] below.", type: "normal" }
  ]);

  const [systemState, setSystemState] = useState<"standby" | "active" | "complete" | "error">("standby");
  const [progress, setProgress] = useState(0);
  const [apiStatus, setApiStatus] = useState<"ONLINE" | "OFFLINE" | "CHECKING">("CHECKING");
  const [visitorCount, setVisitorCount] = useState(0);

  const [alertInfo, setAlertInfo] = useState<{ title: string, text: string } | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkHealth()
      .then(() => setApiStatus("ONLINE"))
      .catch(() => setApiStatus("OFFLINE"));

    fetchVisits(true).then(setVisitorCount).catch(() => {});

    const interval = setInterval(() => {
      fetchVisits(false).then(setVisitorCount).catch(() => {});
    }, 6000);

    return () => clearInterval(interval);
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

  const downloadSingleVideo = async (videoUrl: string, fmt: string, q: string) => {
    logToConsole('Downloading and converting media... This may take a few moments.', 'normal');
    
    const { blob, filename } = await downloadVideoBlob(videoUrl, fmt, q);

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

    logToConsole(`File ready. Starting browser download: ${filename}`, 'warning');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setAlertInfo({ title: 'STREAM FAULT', text: 'No source link URL discovered in input stream. Paste valid target addresses into buffer [0x01].' });
      return;
    }

    setSystemState('active');
    logToConsole(`Initializing download request for: ${url}`, 'info');
    startFakeProgress();

    try {
      logToConsole('Fetching video metadata from server...', 'normal');
      const info = await fetchVideoInfo(url.trim());

      if (!info.is_playlist) {
        logToConsole(`Metadata retrieved. Video title: ${info.title}`, 'success');
        logToConsole(`Requesting high-quality extraction for format: ${format.toUpperCase()}`, 'normal');
        await downloadSingleVideo(url.trim(), format, format === 'mp3' ? audioQuality : videoQuality);
        logToConsole('Download complete! Check your browser downloads.', 'success');
      } else {
        const entries = info.entries || [];
        if (entries.length === 0) {
          throw new Error('Playlist is empty or could not be parsed.');
        }

        logToConsole(`Playlist retrieved: ${info.title} [${entries.length} items]`, 'success');

        let successCount = 0;
        let failCount = 0;

        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        setProgress(0);

        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          logToConsole(`[${i + 1}/${entries.length}] Processing: ${entry.title}...`, 'info');

          try {
            await downloadSingleVideo(entry.url, format, format === 'mp3' ? audioQuality : videoQuality);
            successCount++;
            setProgress(((i + 1) / entries.length) * 100);
            logToConsole(`[${i + 1}/${entries.length}] SUCCESS!`, 'success');
          } catch (err: any) {
            logToConsole(`[${i + 1}/${entries.length}] FAILED: ${err.message}`, 'error');
            failCount++;
          }
        }

        if (failCount === 0) {
          logToConsole(`Successfully downloaded all ${successCount} items in playlist!`, 'success');
        } else {
          logToConsole(`Playlist processing finished: ${successCount} successful, ${failCount} failed.`, 'warning');
        }
      }

      setUrl('');
      completeProgress();
      setSystemState('complete');

    } catch (error: any) {
      completeProgress();
      setSystemState('error');
      logToConsole(`Error during download: ${error.message}`, 'error');
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

  return (
    <>
      <AlertModal alertInfo={alertInfo} onClose={() => setAlertInfo(null)} />

      {/* MAIN PORTAL CONTAINER */}
      <div className="w-full max-w-4xl flex flex-col space-y-4 z-10 font-[family-name:var(--font-share-tech)]">
        <Header apiStatus={apiStatus} />

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
                  {format === 'mp3' ? (
                    <select
                      value={audioQuality}
                      onChange={(e) => { setAudioQuality(e.target.value); }}
                      className="w-full p-2 bg-black text-xs text-slate-300 border border-slate-800 font-mono focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="320">320 kbps (Highest Quality)</option>
                      <option value="256">256 kbps</option>
                      <option value="192">192 kbps (Standard)</option>
                      <option value="128">128 kbps</option>
                      <option value="96">96 kbps</option>
                      <option value="64">64 kbps (Fastest)</option>
                    </select>
                  ) : (
                    <select
                      value={videoQuality}
                      onChange={(e) => { setVideoQuality(e.target.value); }}
                      className="w-full p-2 bg-black text-xs text-slate-300 border border-slate-800 font-mono focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="2160">4K (2160p)</option>
                      <option value="1440">2K (1440p)</option>
                      <option value="1080">HD (1080p)</option>
                      <option value="720">HD (720p)</option>
                      <option value="480">SD (480p)</option>
                      <option value="360">SD (360p)</option>
                      <option value="240">SD (240p)</option>
                      <option value="144">SD (144p)</option>
                    </select>
                  )}
                </div>
              </div>

              <TerminalLog logs={logs} ref={consoleRef} />
              <ProgressBar progress={progress} />

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
            <ThemeMatrix logToConsole={logToConsole} />
            <VisitorCounter visitorCount={visitorCount} />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
