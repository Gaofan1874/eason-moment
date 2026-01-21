import React, { useEffect, useState } from 'react';
import './UpdateNotifier.css';

const UpdateNotifier: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [show, setShow] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    // Only run in Electron environment
    if (!(window as any).ipcRenderer) return;

    const handleUpdateMessage = (_event: any, message: any) => {
      // Ignore checking/not-available to avoid spamming the user
      // unless we add a "Check for updates" button later
      if (message.type === 'checking' || message.type === 'not-available') return;

      console.log('Update Message:', message);
      
      switch (message.type) {
        case 'available':
          setShow(true);
          setStatus('发现新版本 v' + (message.info?.version || '') + '，准备下载...');
          break;
        case 'progress':
          setShow(true);
          setStatus(`正在下载更新 ${(message.progress?.percent || 0).toFixed(1)}%`);
          setProgress(message.progress?.percent || 0);
          break;
        case 'downloaded':
          setShow(true);
          setStatus('新版本下载完成，请重启生效');
          setDownloaded(true);
          setProgress(100);
          break;
        case 'error':
          // Optionally show error, but usually better to fail silently for auto-updates
          console.error('Update error:', message);
          break;
      }
    };

    (window as any).ipcRenderer.on('update-message', handleUpdateMessage);

    // Cleanup
    return () => {
      // Note: In our preload, we exposed removeAllListeners, not removeListener
      if ((window as any).ipcRenderer) {
        (window as any).ipcRenderer.removeAllListeners('update-message');
      }
    };
  }, []);

  const handleRestart = () => {
    (window as any).ipcRenderer.send('restart_app');
  };

  if (!show) return null;

  return (
    <div className="update-notification">
      <div className="update-content">
        <div className="update-text">{status}</div>
        {!downloaded && (
          <div className="update-progress-bar">
            <div className="update-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
        {downloaded && (
          <button className="update-restart-btn" onClick={handleRestart}>
            立即重启更新
          </button>
        )}
        <button className="update-close-btn" onClick={() => setShow(false)}>×</button>
      </div>
    </div>
  );
};

export default UpdateNotifier;