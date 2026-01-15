import React from 'react';
import { Monitor } from 'lucide-react';

interface DesktopLyricControlsProps {
  desktopColor: string;
  handleDesktopColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DesktopLyricControls: React.FC<DesktopLyricControlsProps> = ({
  desktopColor,
  handleDesktopColorChange,
}) => {
  return (
    <div className="control-group">
      <div className="label-row">
        <span className="control-label">
          <Monitor size={14} /> 桌面歌词
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="control-value">文字颜色</span>
        <div style={{ position: 'relative', width: 24, height: 24 }}>
          <input
            type="color"
            value={desktopColor}
            onChange={handleDesktopColorChange}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              padding: 0,
              background: 'none',
              cursor: 'pointer',
              opacity: 0,
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 2,
            }}
          />
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: desktopColor,
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DesktopLyricControls;
