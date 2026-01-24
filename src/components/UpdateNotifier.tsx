import React, { useEffect, useState } from 'react';
import './UpdateNotifier.css';

type UpdateState = 'idle' | 'checking' | 'available' | 'progress' | 'downloaded' | 'not-available' | 'error';

const UpdateNotifier: React.FC = () => {
  const [state, setState] = useState<UpdateState>('idle');
  const [statusText, setStatusText] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [versionInfo, setVersionInfo] = useState<string>('');

  useEffect(() => {
    // Only run in Electron environment
    if (!(window as any).ipcRenderer) return;

    const handleUpdateMessage = (_event: any, message: any) => {
      console.log('Update Message:', message);
      
      switch (message.type) {
        case 'checking':
          setState('checking');
          setStatusText('正在检查更新...');
          break;
        case 'available':
          setState('available');
          setVersionInfo(message.info?.version || '');
          setStatusText(`发现新版本 v${message.info?.version}`);
          break;
        case 'not-available':
          setState('not-available');
          setStatusText('当前已是最新版本');
          // Auto-hide after 3 seconds
          setTimeout(() => setState('idle'), 3000);
          break;
        case 'progress':
          setState('progress');
          setProgress(message.progress?.percent || 0);
          setStatusText(`正在下载 ${(message.progress?.percent || 0).toFixed(1)}%`);
          break;
        case 'downloaded':
          setState('downloaded');
          setStatusText('下载完成，请重启安装');
          break;
        case 'error':
          setState('error');
          setStatusText(message.text || '检查更新失败');
          break;
      }
    };

    (window as any).ipcRenderer.on('update-message', handleUpdateMessage);

    return () => {
      if ((window as any).ipcRenderer) {
        (window as any).ipcRenderer.removeAllListeners('update-message');
      }
    };
  }, []);

  const handleStartDownload = () => {
    (window as any).ipcRenderer.send('start-download');
  };

  const handleManualDownload = () => {
    (window as any).ipcRenderer.send('open-download-link');
    setState('idle'); // Close dialog
  };

  const handleInstall = () => {
    (window as any).ipcRenderer.send('install-update');
  };

  const handleClose = () => {
    setState('idle');
  };

  if (state === 'idle') return null;

  return (
    <div className="update-notification">
      <button className="update-close-btn" onClick={handleClose}>×</button>
      <div className="update-content">
        <div className="update-text">{statusText}</div>
        
        {state === 'available' && (
          <div className="update-actions">
            <button className="update-btn primary" onClick={handleStartDownload}>
              立即更新
            </button>
            <button className="update-btn secondary" onClick={handleManualDownload}>
              前往下载
            </button>
          </div>
        )}

        {state === 'progress' && (
          <div className="update-progress-bar">
            <div className="update-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}

        {state === 'downloaded' && (
          <div className="update-actions">
            <button className="update-btn primary" onClick={handleInstall}>
              立即重启
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateNotifier;