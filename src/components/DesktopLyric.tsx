import React, { useEffect, useState } from 'react';

interface LyricData {
  content: string;
  song: string;
  album: string;
}

const DesktopLyric: React.FC = () => {
  const [lyric, setLyric] = useState<LyricData>({ content: 'Eason Moment', song: '', album: '' });
  const [color, setColor] = useState('#ffffff');

  useEffect(() => {
    // Request current lyric on mount
    if ((window as any).ipcRenderer) {
      (window as any).ipcRenderer.send('get-current-lyric');
      
      (window as any).ipcRenderer.on('update-lyric', (_event: any, newLyric: LyricData) => {
        setLyric(newLyric);
      });

      (window as any).ipcRenderer.on('update-lyric-color', (_event: any, newColor: string) => {
        setColor(newColor);
      });
    }
  }, []);

  return (
    <div 
      className="desktop-lyric-container"
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        WebkitAppRegion: 'drag', // Allow dragging anywhere
        transition: 'background 0.3s',
        userSelect: 'none',
        cursor: 'move'
      } as any}
    >
      <div style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: color,
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)',
        lineHeight: 1.4,
        padding: '0 20px',
        fontFamily: '"Microsoft YaHei", sans-serif'
      }}>
        {lyric.content}
      </div>
      
      {/* Always show song & album info */}
      <div style={{
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
        pointerEvents: 'none'
      }}>
        {lyric.song ? `—— ${lyric.song} · ${lyric.album}` : ''}
      </div>
    </div>
  );
};

export default DesktopLyric;
