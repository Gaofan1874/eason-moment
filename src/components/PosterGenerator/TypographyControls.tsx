import { Settings, RotateCcw } from 'lucide-react';

interface TypographyControlsProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  lineHeight: number;
  setLineHeight: (height: number) => void;
  textOffsetY: number;
  setTextOffsetY: (offset: number) => void;
  textOffsetX: number;
  setTextOffsetX: (offset: number) => void;
  resetTypography: () => void;
  mergeSpaces: boolean;
  setMergeSpaces: (merge: boolean) => void;
}

const TypographyControls: React.FC<TypographyControlsProps> = ({
  fontSize,
  setFontSize,
  lineHeight,
  setLineHeight,
  textOffsetY,
  setTextOffsetY,
  textOffsetX,
  setTextOffsetX,
  resetTypography,
  mergeSpaces,
  setMergeSpaces,
}) => {
  return (
    <div className="control-group">
      <div className="label-row">
        <span className="control-label">
          <Settings size={14} /> 排版样式
        </span>
        <button className="btn-icon" onClick={resetTypography} title="重置排版参数">
          <RotateCcw size={14} />
        </button>
      </div>

      <label className="checkbox-wrapper" style={{ marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={mergeSpaces}
          onChange={(e) => setMergeSpaces(e.target.checked)}
        />
        <span className="control-value">紧凑模式 (空格不换行)</span>
      </label>

      <div>
        <div className="label-row" style={{ marginBottom: 4 }}>
          <span className="control-value">字体大小</span>
          <span className="control-value">{fontSize}px</span>
        </div>
        <input
          type="range"
          min={24}
          max={200}
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
        />
      </div>

      <div>
        <div className="label-row" style={{ marginBottom: 4 }}>
          <span className="control-value">行间距</span>
          <span className="control-value">{lineHeight}px</span>
        </div>
        <input
          type="range"
          min={40}
          max={300}
          value={lineHeight}
          onChange={(e) => setLineHeight(parseInt(e.target.value))}
        />
      </div>

      <div>
        <div className="label-row" style={{ marginBottom: 4 }}>
          <span className="control-value">垂直偏移</span>
          <span className="control-value">{textOffsetY}</span>
        </div>
        <input
          type="range"
          min={-600}
          max={600}
          value={textOffsetY}
          onChange={(e) => setTextOffsetY(parseInt(e.target.value))}
        />
      </div>

      <div>
        <div className="label-row" style={{ marginBottom: 4 }}>
          <span className="control-value">水平偏移</span>
          <span className="control-value">{textOffsetX}</span>
        </div>
        <input
          type="range"
          min={-1500}
          max={1500}
          value={textOffsetX}
          onChange={(e) => setTextOffsetX(parseInt(e.target.value))}
        />
      </div>
    </div>
  );
};

export default TypographyControls;