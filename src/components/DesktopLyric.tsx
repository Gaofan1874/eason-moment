import React, { useEffect, useState } from 'react';

interface LyricData {
  content: string;
  song: string;
  album: string;
}

const DesktopLyric: React.FC = () => {
  const [lyric, setLyric] = useState<LyricData>({ content: 'Waiting for lyrics...', song: '', album: '' });
  const [color, setColor] = useState('#ffffff');

  useEffect(() => {
    const ipc = (window as any).ipcRenderer;
    if (ipc) {
      if (ipc.removeAllListeners) {
        ipc.removeAllListeners('update-lyric');
        ipc.removeAllListeners('update-lyric-color');
      }

      ipc.send('get-current-lyric');

      const updateHandler = (_event: any, newLyric: LyricData) => {
        setLyric(newLyric);
      };

      const colorHandler = (_event: any, newColor: string) => {
        setColor(newColor);
      };

      ipc.on('update-lyric', updateHandler);
      ipc.on('update-lyric-color', colorHandler);

      return () => {
        if (ipc.off) {
          ipc.off('update-lyric', updateHandler);
          ipc.off('update-lyric-color', colorHandler);
        }
      };
    }
  }, []);

  return (
    <div
      className="desktop-lyric-container"
      style={
        {
          width: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.01)',
          WebkitAppRegion: 'drag',
          transition: 'background 0.3s',
          userSelect: 'none',
          cursor: 'move',
          willChange: 'transform', 
          transform: 'translateZ(0)',
        } as any
      }
    >
      <div
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: color,
          textAlign: 'center',
          textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)',
          lineHeight: 1.4,
          padding: '0 20px',
          fontFamily: '"Microsoft YaHei", sans-serif',
        }}
      >
        {lyric.content}
      </div>

      {lyric.song && (
        <div
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#dddddd',
            marginTop: '8px',
            opacity: 1,
            transition: 'all 0.3s ease',
            textShadow: '0 1px 2px rgba(0,0,0,0.9)',
            background: 'rgba(0,0,0,0.3)',
            padding: '2px 12px',
            borderRadius: '10px',
            pointerEvents: 'none',
          }}
        >
          {`—— ${lyric.song} · ${lyric.album}`}
        </div>
      )}
    </div>
  );
};

export default DesktopLyric;