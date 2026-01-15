import React from 'react';
import { Layers } from 'lucide-react';

interface ThemeSelectorProps {
  theme: string;
  onThemeChange: (theme: 'classic' | 'polaroid' | 'cinema') => void;
  getThemeLabel: (t: string) => string;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ theme, onThemeChange, getThemeLabel }) => {
  return (
    <div className="control-group">
      <div className="label-row">
        <span className="control-label">
          <Layers size={14} /> 主题风格
        </span>
      </div>
      <div className="theme-grid">
        {(['classic', 'polaroid', 'cinema'] as const).map((t) => (
          <div
            key={t}
            onClick={() => onThemeChange(t)}
            className={`theme-card ${theme === t ? 'active' : ''}`}
          >
            {getThemeLabel(t)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;
