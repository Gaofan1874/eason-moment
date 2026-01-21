import { Maximize, RefreshCw } from 'lucide-react';
import { AspectRatioType } from './constants';

interface RatioSelectorProps {
  ratio: AspectRatioType;
  onRatioChange: (ratio: AspectRatioType) => void;
}

const RatioSelector: React.FC<RatioSelectorProps> = ({ ratio, onRatioChange }) => {
  
  // Define ratio groups for toggling
  const getBaseRatio = (r: AspectRatioType): '3:4' | '1:1' | '16:9' => {
    if (r === 'portrait' || r === 'landscape_4_3') return '3:4';
    if (r === 'square') return '1:1';
    if (r === 'landscape' || r === 'mobile_wallpaper') return '16:9';
    return '3:4';
  };

  const currentBase = getBaseRatio(ratio);

  const handleRotate = () => {
    if (ratio === 'portrait') onRatioChange('landscape_4_3');
    else if (ratio === 'landscape_4_3') onRatioChange('portrait');
    else if (ratio === 'landscape') onRatioChange('mobile_wallpaper');
    else if (ratio === 'mobile_wallpaper') onRatioChange('landscape');
  };

  const isRotatable = ratio !== 'square';

  return (
    <div className="control-group">
      <div className="label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="control-label">
          <Maximize size={14} /> 画布尺寸
        </span>
        <button 
          className="btn-secondary" 
          onClick={handleRotate} 
          disabled={!isRotatable}
          style={{ opacity: isRotatable ? 1 : 0.5, padding: '4px 8px', fontSize: '11px' }}
          title="旋转画布"
        >
          <RefreshCw size={12} style={{ marginRight: 4 }} /> 
          旋转
        </button>
      </div>
      
      <div className="theme-grid">
        {/* 3:4 Group */}
        <div
          onClick={() => onRatioChange(ratio === 'landscape_4_3' ? 'landscape_4_3' : 'portrait')}
          className={`theme-card ${currentBase === '3:4' ? 'active' : ''}`}
          style={{ fontSize: 11 }}
        >
          {ratio === 'landscape_4_3' ? '4:3' : '3:4'} <br/>
          <span style={{ opacity: 0.6 }}>{ratio === 'landscape_4_3' ? '横版' : '竖版'}</span>
        </div>

        {/* 1:1 Group */}
        <div
          onClick={() => onRatioChange('square')}
          className={`theme-card ${currentBase === '1:1' ? 'active' : ''}`}
          style={{ fontSize: 11 }}
        >
          1:1 <br/>
          <span style={{ opacity: 0.6 }}>方图</span>
        </div>

        {/* 16:9 Group */}
        <div
          onClick={() => onRatioChange(ratio === 'mobile_wallpaper' ? 'mobile_wallpaper' : 'landscape')}
          className={`theme-card ${currentBase === '16:9' ? 'active' : ''}`}
          style={{ fontSize: 11 }}
        >
          {ratio === 'mobile_wallpaper' ? '9:16' : '16:9'} <br/>
          <span style={{ opacity: 0.6 }}>{ratio === 'mobile_wallpaper' ? '壁纸' : '横版'}</span>
        </div>
      </div>
    </div>
  );
};

export default RatioSelector;
