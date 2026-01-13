import React, { useState } from 'react';
import { X, Minus } from 'lucide-react';

const TitleBar: React.FC = () => {
  // Use 'any' to bypass TS check for window.ipcRenderer for now
  const platform = (window as any).ipcRenderer?.platform;
  const isMac = platform === 'darwin';

  // If Mac, we don't need a custom titlebar (using native hiddenInset)
  if (isMac) return null;

  const handleMinimize = () => {
    (window as any).ipcRenderer?.send('window-minimize');
  };

  const handleClose = () => {
    (window as any).ipcRenderer?.send('window-close');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '32px',
      background: '#2a2a2e', // Match workspace bg
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      zIndex: 9999,
      WebkitAppRegion: 'drag' // Make it draggable
    } as React.CSSProperties}>
      <div style={{ display: 'flex', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button 
          onClick={handleMinimize}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#ccc',
            width: '46px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          className="win-control-btn"
        >
          <Minus size={16} />
        </button>
        <button 
          onClick={handleClose}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#ccc',
            width: '46px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          className="win-control-btn close"
        >
          <X size={16} />
        </button>
      </div>
      <style>{`
        .win-control-btn:hover { background-color: rgba(255,255,255,0.1) !important; }
        .win-control-btn.close:hover { background-color: #e81123 !important; color: white !important; }
      `}</style>
    </div>
  );
};

export default TitleBar;
