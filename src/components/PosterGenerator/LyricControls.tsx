import React from 'react';
import { Type, Shuffle } from 'lucide-react';
import { LyricData } from './constants';

interface LyricControlsProps {
  lyric: LyricData;
  setLyric: (lyric: LyricData) => void;
  handleRandomLyric: () => void;
}

const LyricControls: React.FC<LyricControlsProps> = ({
  lyric,
  setLyric,
  handleRandomLyric,
}) => {
  return (
    <div className="control-group">
      <div className="label-row">
        <span className="control-label">
          <Type size={14} /> 歌词内容
        </span>
        <button className="btn-secondary" onClick={handleRandomLyric}>
          <Shuffle size={12} /> 随机
        </button>
      </div>
      <textarea
        className="lyric-input"
        rows={4}
        value={lyric.content}
        onChange={(e) => setLyric({ ...lyric, content: e.target.value })}
      />
    </div>
  );
};

export default LyricControls;
