import React from 'react';
import { Settings } from 'lucide-react';

interface ExportControlsProps {
  loadingIcon: string;
  loadingIconInputRef: React.RefObject<HTMLInputElement>;
  handleLoadingIconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  animationType: 'pulse' | 'rotate';
  setAnimationType: (type: 'pulse' | 'rotate') => void;
}

const ExportControls: React.FC<ExportControlsProps> = ({
  loadingIcon,
  loadingIconInputRef,
  handleLoadingIconUpload,
  animationType,
  setAnimationType,
}) => {
  return (
    <div className="control-group">
      <div className="label-row">
        <span className="control-label">
          <Settings size={14} /> 导出偏好
        </span>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div
          className="theme-card"
          style={{
            width: 48,
            height: 48,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
          onClick={() => loadingIconInputRef.current?.click()}
          title="更换加载图标"
        >
          <img
            src={loadingIcon}
            alt="Icon"
            style={{ width: 32, height: 32, objectFit: 'contain' }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>加载动画</div>
          <div className="theme-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div
              className={`theme-card ${animationType === 'rotate' ? 'active' : ''}`}
              onClick={() => setAnimationType('rotate')}
            >
              旋转
            </div>
            <div
              className={`theme-card ${animationType === 'pulse' ? 'active' : ''}`}
              onClick={() => setAnimationType('pulse')}
            >
              脉动
            </div>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={loadingIconInputRef}
        onChange={handleLoadingIconUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ExportControls;
