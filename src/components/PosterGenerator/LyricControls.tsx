import React, { useState, useEffect, useRef } from 'react';
import { Type, Shuffle, Search, X } from 'lucide-react';
import { LyricData } from './constants';
import lyricsData from '../../assets/lyrics.json';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<typeof lyricsData>([]);
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim()) {
      const lowerTerm = term.toLowerCase();
      const filtered = lyricsData.filter(item => 
        item.content.toLowerCase().includes(lowerTerm) || 
        item.song.toLowerCase().includes(lowerTerm)
      ).slice(0, 50);
      
      setResults(filtered);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  const handleSelectLyric = (item: typeof lyricsData[0]) => {
    setLyric({
      content: item.content,
      song: item.song,
      album: item.album,
    });
    setSearchTerm('');
    setShowResults(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="control-group">
      <div className="label-row">
        <span className="control-label">
          <Type size={14} /> 歌词内容
        </span>
        <button className="btn-secondary" onClick={handleRandomLyric}>
          <Shuffle size={12} /> 随机一句
        </button>
      </div>

      <div className="search-wrapper" ref={wrapperRef}>
        <div className="search-input-container">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="在 400+ 句官方歌词中搜索..."
            value={searchTerm}
            onChange={handleSearch}
            onFocus={() => searchTerm.trim() && setShowResults(true)}
          />
          {searchTerm && (
            <div className="search-clear-btn" onClick={clearSearch}>
              <X size={12} />
            </div>
          )}
        </div>
        
        {showResults && results.length > 0 && (
          <div className="search-results">
            {results.map((item) => (
              <div 
                key={item.id} 
                className="search-result-item"
                onClick={() => handleSelectLyric(item)}
              >
                <div className="search-result-content">{item.content}</div>
                <div className="search-result-meta">{item.song} · {item.album}</div>
              </div>
            ))}
          </div>
        )}
        
        {showResults && searchTerm && results.length === 0 && (
          <div className="search-results">
            <div className="search-result-item" style={{ cursor: 'default', color: '#999', textAlign: 'center' }}>
              未找到相关官方歌词
            </div>
          </div>
        )}
      </div>

      <textarea
        className="lyric-input"
        rows={4}
        value={lyric.content}
        onChange={(e) => setLyric({ ...lyric, content: e.target.value })}
        placeholder="支持手动编辑歌词换行，仅对当前海报生效"
      />

      <div className="lyric-metadata-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '8px',
        marginTop: '8px'
      }}>
        <div className="meta-input-group">
          <input 
            type="text" 
            placeholder="歌曲名"
            value={lyric.song}
            onChange={(e) => setLyric({ ...lyric, song: e.target.value })}
            style={{ width: '100%', fontSize: '11px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="meta-input-group">
          <input 
            type="text" 
            placeholder="专辑名"
            value={lyric.album}
            onChange={(e) => setLyric({ ...lyric, album: e.target.value })}
            style={{ width: '100%', fontSize: '11px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="meta-input-group">
          <input 
            type="text" 
            placeholder="作词"
            value={lyric.lyricist || ''}
            onChange={(e) => setLyric({ ...lyric, lyricist: e.target.value })}
            style={{ width: '100%', fontSize: '11px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="meta-input-group">
          <input 
            type="text" 
            placeholder="作曲"
            value={lyric.composer || ''}
            onChange={(e) => setLyric({ ...lyric, composer: e.target.value })}
            style={{ width: '100%', fontSize: '11px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>
    </div>
  );
};

export default LyricControls;
