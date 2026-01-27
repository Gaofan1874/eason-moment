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
import { Music, Layout, Image as ImageIcon, Settings, Palette, RefreshCw, CheckCircle2, X, Download, AlertCircle } from 'lucide-react';

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
type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error' | 'up-to-date';

// --- Update Modal Component ---
interface UpdateModalProps {
  status: UpdateStatus;
  version: string;
  info: any;
  onClose: () => void;
  onCheck: () => void;
  onManual: () => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ 
  status, version, info, onClose, onCheck, onManual 
}) => {
  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.4)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(2px)'
    }}>
      <div className="modal-content" style={{
        width: '320px', background: 'var(--bg-surface)', 
        borderRadius: '12px', padding: '24px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        border: '1px solid var(--border-color)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            {status === 'checking' ? '正在检查...' : 
             status === 'available' ? '发现新版本' :
             status === 'up-to-date' ? '已是最新' : '软件更新'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ minHeight: '60px', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '24px' }}>
          
          {status === 'checking' && (
             <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                <RefreshCw className="spin" size={16} /> 正在连接服务器...
             </div>
          )}

          {status === 'up-to-date' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '10px 0' }}>
               <CheckCircle2 size={32} color="#1F7A1F" />
               <span>当前版本 v{version} 已是最新</span>
            </div>
          )}

          {status === 'available' && info && (
            <div>
               <div style={{ marginBottom: 10, fontWeight: 600, color: 'var(--accent-color)', fontSize: '14px' }}>
                 v{info.version} 来了！
               </div>
               <div style={{ 
                 background: 'var(--bg-secondary)', padding: '12px', 
                 borderRadius: '8px', maxHeight: '150px', overflowY: 'auto',
                 whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: '1.6',
                 color: 'var(--text-secondary)', border: '1px solid var(--border-color)'
               }}>
                 {info.notes || '优化了一些细节体验。'}
               </div>
            </div>
          )}

          {(status === 'error' || status === 'idle') && (
            <div style={{ color: 'var(--text-secondary)' }}>
               点击下方按钮检查是否有新版本可用。
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {status === 'available' ? (
             <>
               <button className="btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
                 暂不更新
               </button>
               <button className="btn-primary" onClick={onManual} style={{ flex: 1.5, justifyContent: 'center' }}>
                 <Download size={14} style={{ marginRight: 6 }} /> 立即下载
               </button>
             </>
          ) : (
             <button className="btn-primary" onClick={status === 'checking' ? undefined : onCheck} style={{ width: '100%', justifyContent: 'center' }} disabled={status === 'checking'}>
               {status === 'checking' ? '检查中...' : '检查更新'}
             </button>
          )}
        </div>
      </div>
    </div>
  );
};


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
  
  // Update State
  const [appVersion, setAppVersion] = useState<string>('0.0.0');
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [updateError, setUpdateError] = useState<string>('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  
  // Helper to update lyric state and sync with main process (Desktop Lyric)
  const updateLyricAndSync = (newLyric: LyricData) => {
    setLyric(newLyric);
    if ((window as any).ipcRenderer) {
      (window as any).ipcRenderer.send('set-current-lyric', newLyric);
    }
  };
  
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
      
      const version = (window as any).ipcRenderer.sendSync('get-app-version');
      if (version) setAppVersion(version);

      const handleUpdateMessage = (_event: any, message: any) => {
        console.log('Renderer received update message:', message);
        switch (message.type) {
          case 'checking':
            setUpdateStatus('checking');
            break;
          case 'available':
            setUpdateStatus('available');
            setUpdateInfo({ ...message.info, notes: message.notes });
            // Don't auto show modal, just let the badge show
            break;
          case 'not-available':
            setUpdateStatus('up-to-date');
            break;
          case 'progress':
            setUpdateStatus('downloading');
            setDownloadProgress(message.progress.percent);
            break;
          case 'downloaded':
            setUpdateStatus('downloaded');
            setUpdateInfo({ ...message.info, notes: message.notes });
            // Optionally auto-open modal when download finishes? 
            // Better to let user click the badge which will now indicate "ready"
            setShowUpdateModal(true); 
            break;
          case 'error':
            setUpdateStatus('error');
            setUpdateError(message.text);
            break;
        }
      };
      (window as any).ipcRenderer.on('update-message', handleUpdateMessage);
      
      return () => {
        (window as any).ipcRenderer.removeAllListeners('update-message');
      };
    }
  }, []);

  useEffect(() => {
    if (img) {
        fitImageToLayout(img, theme, ratio);
    }
  }, [ratio, theme]); 

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

  // Update Handlers
  const handleCheckForUpdate = () => {
    // If we already have status, just open modal
    if (updateStatus !== 'idle' && updateStatus !== 'error') {
       setShowUpdateModal(true);
       return;
    }

    setShowUpdateModal(true); // Open modal to show "Checking..."
    if ((window as any).ipcRenderer) {
      (window as any).ipcRenderer.send('check-for-update');
    }
  };

  const handleStartDownload = () => {
    if ((window as any).ipcRenderer) {
      (window as any).ipcRenderer.send('start-download');
    }
  };

  const handleInstallUpdate = () => {
    if ((window as any).ipcRenderer) {
      (window as any).ipcRenderer.send('install-update');
    }
  };

  const handleManualDownload = () => {
     if ((window as any).ipcRenderer) {
      (window as any).ipcRenderer.send('open-download-link', 'https://github.com/Gaofan1874/eason-moment/releases');
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
      
      {showUpdateModal && (
        <UpdateModal
          status={updateStatus}
          version={appVersion}
          info={updateInfo}
          progress={downloadProgress}
          error={updateError}
          onClose={() => setShowUpdateModal(false)}
          onCheck={handleCheckForUpdate}
          onDownload={handleStartDownload}
          onInstall={handleInstallUpdate}
          onManual={handleManualDownload}
        />
      )}

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
            <>
              <Section title="歌词与灵感">
                <LyricControls 
                  lyric={lyric} 
                  setLyric={updateLyricAndSync} 
                />
              </Section>
              <div className="control-group" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={mergeSpaces}
                    onChange={(e) => setMergeSpaces(e.target.checked)}
                  />
                  <span className="control-value" style={{ fontSize: '12px' }}>紧凑模式 (自动压缩空格换行)</span>
                </label>
              </div>
            </>
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
              
              {/* Minimal Version & Update Trigger */}
              <div style={{ 
                marginTop: 'auto', 
                padding: '16px 20px', 
                borderTop: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                color: 'var(--text-secondary)',
                fontSize: '11px'
              }}>
                 <span style={{ marginRight: 8, opacity: 0.7 }}>v{appVersion}</span>
                 <button 
                   onClick={handleCheckForUpdate}
                   title="检查更新"
                   style={{
                     background: 'none', border: 'none', cursor: 'pointer',
                     display: 'flex', alignItems: 'center', justifyContent: 'center',
                     padding: '4px', position: 'relative',
                     color: updateStatus === 'available' ? 'var(--accent-color)' : 'inherit'
                   }}
                 >
                   <RefreshCw size={12} className={updateStatus === 'checking' ? 'spin' : ''} />
                   {(updateStatus === 'available' || updateStatus === 'downloaded') && (
                     <span style={{
                       position: 'absolute', top: 2, right: 2,
                       width: 6, height: 6, borderRadius: '50%',
                       background: '#C62828',
                       boxShadow: '0 0 0 1px var(--bg-surface)'
                     }} />
                   )}
                 </button>
              </div>

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