import React from 'react';
import { Image as ImageIcon, RefreshCw, Palette } from 'lucide-react';
import { FILTER_OPTIONS } from './constants';

interface ImageControlsProps {
  img: HTMLImageElement | null;
  fitImageToLayout: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imageFilter: string;
  setImageFilter: (filter: string) => void;
  showWatermark: boolean;
  setShowWatermark: (show: boolean) => void;
}

const ImageControls: React.FC<ImageControlsProps> = ({
  img,
  fitImageToLayout,
  fileInputRef,
  handleImageUpload,
  imageFilter,
  setImageFilter,
  showWatermark,
  setShowWatermark,
}) => {
  return (
    <div className="control-group">
      <div className="label-row">
        <span className="control-label">
          <ImageIcon size={14} /> 背景图片
        </span>
        <button
          className="btn-icon"
          onClick={() => img && fitImageToLayout()}
          title="重置布局"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="upload-trigger" onClick={() => fileInputRef.current?.click()}>
        <ImageIcon size={24} color="#d4a373" />
        <span className="upload-trigger-text">上传你的照片</span>
        <span className="upload-trigger-hint">支持 JPG、PNG、WebP 格式</span>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      <div style={{ marginTop: 12 }}>
        <div className="label-row" style={{ marginBottom: 6 }}>
          <span className="control-value">
            <Palette size={12} style={{ marginRight: 4 }} /> 图片滤镜
          </span>
        </div>
        <div className="theme-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {FILTER_OPTIONS.map((f) => (
            <div
              key={f.value}
              onClick={() => setImageFilter(f.value)}
              className={`theme-card ${imageFilter === f.value ? 'active' : ''}`}
              style={{ fontSize: 11, padding: '6px 2px' }}
            >
              {f.label}
            </div>
          ))}
        </div>
      </div>

      <label className="checkbox-wrapper" style={{ marginTop: 12 }}>
        <input
          type="checkbox"
          checked={showWatermark}
          onChange={(e) => setShowWatermark(e.target.checked)}
        />
        <span className="control-value">显示 Eason Moment 水印</span>
      </label>
    </div>
  );
};

export default ImageControls;
