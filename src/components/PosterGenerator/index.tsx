import React, { useEffect, useRef, useState, useCallback } from 'react';
import lyricsData from '../../assets/lyrics.json';
import appIcon from '../../assets/icon.png';
import defaultBg from '../../assets/light_eason.png';
import './index.css';
import TitleBar from '../TitleBar';
import { 
    ASPECT_RATIOS, 
    THEME_DEFAULTS,
    ThemeConfig,
    LyricData,
    AspectRatioType
} from './constants';
import { drawCinema, drawClassic, drawPolaroid, drawVertical } from './posterUtils';
import RatioSelector from './RatioSelector';
import ThemeSelector from './ThemeSelector';
import LyricControls from './LyricControls';
import TypographyControls from './TypographyControls';
import ImageControls from './ImageControls';
import DesktopLyricControls from './DesktopLyricControls';
import ExportControls from './ExportControls';
import { Music, Layout, Image as ImageIcon, Settings, Palette } from 'lucide-react';

const DEFAULT_LYRIC: LyricData = {
  content: lyricsData[0].content,
  song: lyricsData[0].song,
  album: lyricsData[0].album,
};

const APP_THEMES = [
  { id: 'chin-up', label: 'CHIN UP!', colors: ['#F0F4F8', '#0E5FAC'] },
  { id: 'theme-duo', label: 'DUO', colors: ['#f0f0f0', '#d4a373'] },
  { id: 'theme-love', label: 'L.O.V.E.', colors: ['#F0F4F8', '#3B5C7D'] },
  { id: 'theme-fear', label: 'FEAR&DREAMS', colors: ['#CED4DA', '#C23B68'] },
  { id: 'theme-key', label: 'THE KEY', colors: ['#EFE8D8', '#A63737'] },
];

// --- Section Component ---
interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
  return (
    <div className="inspector-section">
      <div className="section-header">
        <div className="section-title">{title}</div>
      </div>
      <div className="section-content">{children}</div>
    </div>
  );
};

type TabType = 'lyrics' | 'style' | 'image' | 'settings';

const PosterGenerator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load saved app theme from localStorage
  const savedAppTheme = localStorage.getItem('appTheme') || 'chin-up';
  
  // State
  const [activeTab, setActiveTab] = useState<TabType>('lyrics');
  const [appTheme, setAppTheme] = useState(savedAppTheme); // App Theme State
  const [theme, setTheme] = useState<'classic' | 'polaroid' | 'cinema' | 'vertical'>('classic');
  const [ratio, setRatio] = useState<AspectRatioType>('portrait');
  const [lyric, setLyric] = useState(DEFAULT_LYRIC);
  
  // Appearance State
  const [fontSize, setFontSize] = useState(THEME_DEFAULTS.classic.fontSize);
  const [lineHeight, setLineHeight] = useState(THEME_DEFAULTS.classic.lineHeight);
  const [fontFace, setFontFace] = useState(THEME_DEFAULTS.classic.fontFace);
  const [textOffsetY, setTextOffsetY] = useState(0);
  const [textOffsetX, setTextOffsetX] = useState(0); // Add horizontal offset
  const [showWatermark, setShowWatermark] = useState(true);
  const [mergeSpaces, setMergeSpaces] = useState(false);
  
  // Filter State
  const [imageFilter, setImageFilter] = useState('none');
  
  // App State
  const [isExporting, setIsExporting] = useState(false);
  const [loadingIcon, setLoadingIcon] = useState(appIcon);
  const [animationType, setAnimationType] = useState<'pulse' | 'rotate'>('rotate');
  const [desktopColor, setDesktopColor] = useState('#ffffff');
  
  const loadingIconInputRef = useRef<HTMLInputElement>(null);
    
  // Image and transform state
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Get current dimensions
  const { width: canvasW, height: canvasH } = ASPECT_RATIOS[ratio];

  // Helper to get drawing area for image
  const getDrawingArea = useCallback((themeType: string, w: number, h: number) => {
    switch (themeType) {
      case 'polaroid':
        const margin = w * 0.075; 
        const bottomSpace = h * 0.35;
        let photoW = w - (margin * 2);
        let photoH = photoW;
        
        if (photoH > h - bottomSpace - margin) {
            photoH = h - bottomSpace - margin;
            photoW = photoH; 
        }
        
        const photoX = (w - photoW) / 2;
        return { x: photoX, y: margin, w: photoW, h: photoH };
        
      case 'cinema':
        const barHeight = h * 0.15;
        return { x: 0, y: barHeight, w: w, h: h - (barHeight * 2) };
        
      default:
        return { x: 0, y: 0, w: w, h: h };
    }
  }, []);

  const fitImageToLayout = useCallback((image: HTMLImageElement, themeType: string, currentRatio: AspectRatioType) => {
    const { width: w, height: h } = ASPECT_RATIOS[currentRatio];
    const area = getDrawingArea(themeType, w, h);
    
    const areaRatio = area.w / area.h;
    const imgRatio = image.width / image.height;

    let scale;
    if (imgRatio > areaRatio) {
      scale = area.h / image.height;
    } else {
      scale = area.w / image.width;
    }

    setTransform({
      scale: scale,
      x: area.x + (area.w - image.width * scale) / 2,
      y: area.y + (area.h - image.height * scale) / 2,
    });
  }, [getDrawingArea]);

  useEffect(() => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = defaultBg;
    image.onload = () => {
      setImg(image);
      fitImageToLayout(image, theme, ratio);
    };

    if ((window as any).ipcRenderer) {
      (window as any).ipcRenderer.on('update-lyric', (_event: any, newLyric: LyricData) => {
          setLyric(newLyric);
      });
      (window as any).ipcRenderer.on('switch-tab', (_event: any, tab: TabType) => {
          setActiveTab(tab);
      });
      (window as any).ipcRenderer.send('get-current-lyric');
    }
  }, []);

  useEffect(() => {
    if (img) {
        fitImageToLayout(img, theme, ratio);
    }
  }, [ratio, theme]); 

  const handleRandomLyric = () => {
    const randomIndex = Math.floor(Math.random() * lyricsData.length);
    const randomLyric = lyricsData[randomIndex];
    setLyric({
      content: randomLyric.content,
      song: randomLyric.song,
      album: randomLyric.album,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const image = new Image();
      image.src = result;
      image.onload = () => {
        setImg(image);
        fitImageToLayout(image, theme, ratio);
      };
    };
    reader.readAsDataURL(file);
  };
  
  const handleLoadingIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setLoadingIcon(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleDesktopColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setDesktopColor(newColor);
    if ((window as any).ipcRenderer) {
      (window as any).ipcRenderer.send('update-desktop-lyric-style', { color: newColor });
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = ASPECT_RATIOS[ratio];
    
    ctx.clearRect(0, 0, width, height);

    const currentConfig: ThemeConfig = {
        fontSize,
        lineHeight,
        fontFace,
        color: THEME_DEFAULTS[theme].color
    };
    
    const drawParams = {
        ctx,
        w: width,
        h: height,
        config: currentConfig,
        img,
        transform,
        imageFilter,
        lyric,
        textOffsetY,
        textOffsetX,
        showWatermark,
        getDrawingArea,
        mergeSpaces
    };

    if (theme === 'classic') drawClassic(drawParams);
    else if (theme === 'polaroid') drawPolaroid(drawParams);
    else if (theme === 'cinema') drawCinema(drawParams);
    else if (theme === 'vertical') drawVertical(drawParams);
    
  }, [theme, ratio, lyric, fontSize, lineHeight, fontFace, textOffsetY, textOffsetX, showWatermark, img, transform, imageFilter, getDrawingArea, mergeSpaces]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const currentX = e.nativeEvent.offsetX;
    const currentY = e.nativeEvent.offsetY;
    
    const dx = (currentX - lastMousePos.x) * scaleX;
    const dy = (currentY - lastMousePos.y) * scaleY;
    
    setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: currentX, y: currentY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY < 0 ? 1.05 : 0.95;
    setTransform((prev) => ({ ...prev, scale: prev.scale * delta }));
  };

  const handleThemeChange = (newTheme: 'classic' | 'polaroid' | 'cinema' | 'vertical') => {
    setTheme(newTheme);
    const defaults = THEME_DEFAULTS[newTheme];
    setFontSize(defaults.fontSize);
    setLineHeight(defaults.lineHeight);
    setFontFace(defaults.fontFace); 
    setTextOffsetY(0);
    setTextOffsetX(0);
    if (img) fitImageToLayout(img, newTheme, ratio);
  };
  
  const handleRatioChange = (newRatio: AspectRatioType) => {
      setRatio(newRatio);
      if (img) fitImageToLayout(img, theme, newRatio);
  };

  const handleExport = () => {
    if (isExporting) return;
    setIsExporting(true);

    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        setIsExporting(false);
        return;
      }
      const dataUrl = canvas.toDataURL('image/png', 1.0); 

      if ((window as any).ipcRenderer) {
        (window as any).ipcRenderer.send('save-poster', dataUrl);
      }
      setTimeout(() => setIsExporting(false), 1000);
    }, 1500);
  };

  const getThemeLabel = (t: string) => {
    switch (t) {
      case 'classic': return '经典';
      case 'polaroid': return '拍立得';
      case 'cinema': return '电影感';
      case 'vertical': return '文艺';
      default: return t;
    }
  };

  const resetTypography = () => {
    const defaults = THEME_DEFAULTS[theme];
    setFontSize(defaults.fontSize);
    setLineHeight(defaults.lineHeight);
    setFontFace(defaults.fontFace);
    setTextOffsetY(0);
    setTextOffsetX(0);
  };

  const isMac = (window as any).ipcRenderer?.platform === 'darwin';

  return (
    <div className={`app-container ${appTheme}`}>
      {isMac && <div className="titlebar-drag-region" />}
      {!isMac && <TitleBar />}

      <div className="workspace" style={{ paddingTop: isMac ? 'var(--titlebar-height)' : '32px' }}>
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              maxWidth: '100%',
              maxHeight: '85vh',
              width: 'auto',
              height: 'auto',
              display: 'block',
              aspectRatio: `${canvasW}/${canvasH}`
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />
          {isExporting && (
            <div className="loading-overlay">
              <img
                src={loadingIcon}
                className={`loading-icon ${animationType}`}
                alt="Loading"
              />
              <div className="loading-text">正在生成高清海报...</div>
            </div>
          )}
        </div>
      </div>

      <aside className="inspector" style={{ paddingTop: isMac ? 'var(--titlebar-height)' : '32px' }}>
        
        {/* Tab Navigation */}
        <div className="tabs-container">
          <button 
            className={`tab-item ${activeTab === 'lyrics' ? 'active' : ''}`} 
            onClick={() => setActiveTab('lyrics')}
            title="歌词"
          >
            <Music size={18} />
          </button>
          <button 
            className={`tab-item ${activeTab === 'style' ? 'active' : ''}`} 
            onClick={() => setActiveTab('style')}
            title="样式"
          >
            <Layout size={18} />
          </button>
          <button 
            className={`tab-item ${activeTab === 'image' ? 'active' : ''}`} 
            onClick={() => setActiveTab('image')}
            title="配图"
          >
            <ImageIcon size={18} />
          </button>
          <button 
            className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`} 
            onClick={() => setActiveTab('settings')}
            title="设置"
          >
            <Settings size={18} />
          </button>
        </div>

        <div className="scroll-content">
          {activeTab === 'lyrics' && (
            <Section title="歌词与灵感">
              <LyricControls 
                lyric={lyric} 
                setLyric={setLyric} 
                handleRandomLyric={handleRandomLyric} 
              />
            </Section>
          )}

          {activeTab === 'style' && (
            <>
              <Section title="画布比例">
                <RatioSelector ratio={ratio} onRatioChange={handleRatioChange} />
              </Section>
              <Section title="主题风格">
                <ThemeSelector theme={theme} onThemeChange={handleThemeChange} getThemeLabel={getThemeLabel} />
              </Section>
              <Section title="文字排版">
                <TypographyControls
                  fontSize={fontSize}
                  setFontSize={setFontSize}
                  lineHeight={lineHeight}
                  setLineHeight={setLineHeight}
                  textOffsetY={textOffsetY}
                  setTextOffsetY={setTextOffsetY}
                  textOffsetX={textOffsetX}
                  setTextOffsetX={setTextOffsetX}
                  resetTypography={resetTypography}
                  mergeSpaces={mergeSpaces}
                  setMergeSpaces={setMergeSpaces}
                />
              </Section>
            </>
          )}

          {activeTab === 'image' && (
            <Section title="配图与滤镜">
              <ImageControls
                img={img}
                fitImageToLayout={() => img && fitImageToLayout(img, theme, ratio)}
                fileInputRef={fileInputRef}
                handleImageUpload={handleImageUpload}
                imageFilter={imageFilter}
                setImageFilter={setImageFilter}
                showWatermark={showWatermark}
                setShowWatermark={setShowWatermark}
              />
            </Section>
          )}
          
          {activeTab === 'settings' && (
            <>
              <Section title="软件主题 (App Theme)">
                <div className="control-group">
                   <div className="label-row">
                      <span className="control-label">
                        <Palette size={14} /> 选择主题颜色
                      </span>
                   </div>
                   <div className="theme-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                     {APP_THEMES.map((t) => (
                       <div
                          key={t.id}
                          className={`theme-card ${appTheme === t.id ? 'active' : ''}`}
                          onClick={() => {
                            setAppTheme(t.id);
                            localStorage.setItem('appTheme', t.id);
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', textAlign: 'left' }}
                       >
                         <div style={{ 
                            width: 20, 
                            height: 20, 
                            borderRadius: '50%', 
                            background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})`
                         }} />
                         <span style={{ fontSize: 11, fontWeight: 500 }}>{t.label}</span>
                       </div>
                     ))}
                   </div>
                </div>
              </Section>

              <Section title="桌面歌词 (Windows)">
                <DesktopLyricControls 
                  desktopColor={desktopColor}
                  handleDesktopColorChange={handleDesktopColorChange}
                />
              </Section>
              
              <Section title="导出设置">
                <ExportControls
                  loadingIcon={loadingIcon}
                  loadingIconInputRef={loadingIconInputRef}
                  handleLoadingIconUpload={handleLoadingIconUpload}
                  animationType={animationType}
                  setAnimationType={setAnimationType}
                />
              </Section>
            </>
          )}

        </div>

        <div className="inspector-footer">
          <button
            className="btn-primary"
            onClick={handleExport}
            disabled={isExporting}
            style={{ opacity: isExporting ? 0.7 : 1, cursor: isExporting ? 'wait' : 'pointer' }}
          >
            {isExporting ? '生成中...' : '导出高清海报'}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default PosterGenerator;