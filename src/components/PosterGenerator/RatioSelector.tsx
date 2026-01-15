import React from 'react';
import { Maximize } from 'lucide-react';
import { ASPECT_RATIOS, AspectRatioType } from './constants';

interface RatioSelectorProps {
  ratio: AspectRatioType;
  onRatioChange: (ratio: AspectRatioType) => void;
}

const RatioSelector: React.FC<RatioSelectorProps> = ({ ratio, onRatioChange }) => {
  return (
    <div className="control-group">
      <div className="label-row">
        <span className="control-label">
          <Maximize size={14} /> 画布尺寸
        </span>
      </div>
      <div className="theme-grid">
        {(Object.keys(ASPECT_RATIOS) as AspectRatioType[]).map((r) => (
          <div
            key={r}
            onClick={() => onRatioChange(r)}
            className={`theme-card ${ratio === r ? 'active' : ''}`}
            style={{ fontSize: 11 }}
          >
            {ASPECT_RATIOS[r].label.split(' ')[1]} <br/>
            <span style={{ opacity: 0.6 }}>{ASPECT_RATIOS[r].label.split(' ')[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatioSelector;
