import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Type, Image as ImageIcon, Settings, RefreshCw, Shuffle, Layers } from 'lucide-react';
import lyricsData from '../assets/lyrics.json';
import appIcon from '../assets/icon.png';
import defaultBg from '../assets/light_eason.png';
import './PosterGenerator.css';

interface ThemeConfig {
  fontSize: number;
  lineHeight: number;
  fontFace: string;
  color: string;
}

const THEME_DEFAULTS: Record<string, ThemeConfig> = {
  classic: { fontSize: 36, lineHeight: 60, fontFace: 'Microsoft YaHei', color: '#ffffff' },
  polaroid: { fontSize: 26, lineHeight: 42, fontFace: 'Times New Roman', color: '#333333' },
  cinema: { fontSize: 24, lineHeight: 35, fontFace: 'sans-serif', color: '#FFC90E' },
};

interface LyricData {
  content: string;
  song: string;
  album: string;
}

const DEFAULT_LYRIC: LyricData = {
  content: lyricsData[0].content,
  song: lyricsData[0].song,
  album: lyricsData[0].album,
};

const PosterGenerator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<'classic' | 'polaroid' | 'cinema'>('classic');
  const [lyric, setLyric] = useState(DEFAULT_LYRIC);
  const [fontSize, setFontSize] = useState(THEME_DEFAULTS.classic.fontSize);
  const [lineHeight, setLineHeight] = useState(THEME_DEFAULTS.classic.lineHeight);
  const [textOffsetY, setTextOffsetY] = useState(0);
  const [showWatermark, setShowWatermark] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [loadingIcon, setLoadingIcon] = useState(appIcon);
  const [animationType, setAnimationType] = useState<'pulse' | 'rotate'>('rotate');

  const loadingIconInputRef = useRef<HTMLInputElement>(null);

  // Image and transform state
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const image = new Image();
    image.crossOrigin = 'anonymous'; // Fix for tainted canvas
    image.src = defaultBg;
    image.onload = () => {
      setImg(image);
      fitImageToLayout(image, theme);
    };

    // Listen for lyric updates from Tray
    if ((window as any).ipcRenderer) {
      (window as any).ipcRenderer.on(
        'update-lyric',
        (_event: any, newLyric: LyricData) => {
          setLyric(newLyric);
        },
      );
      
      // Request initial lyric from main process
      (window as any).ipcRenderer.send('get-current-lyric');
    }
  }, []);

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
        fitImageToLayout(image, theme);
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

  const getDrawingArea = (themeType: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, w: 600, h: 800 };
    const w = canvas.width;
    const h = canvas.height;

    switch (themeType) {
      case 'polaroid':
        return { x: 45, y: 30, w: w - 90, h: w - 90 };
      case 'cinema':
        return { x: 0, y: 100, w: w, h: h - 200 };
      default:
        return { x: 0, y: 0, w: w, h: h };
    }
  };

  const fitImageToLayout = (image: HTMLImageElement, themeType: string) => {
    const area = getDrawingArea(themeType);
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
  };

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lHeight: number,
  ) => {
    // Split by newline OR space to replicate original behavior
    const segments = text.split(/[\n\r\s]+/);
    let currentY = y;
    let totalLines = 0;

    for (const segment of segments) {
      const chars = segment.split('');
      let line = '';

      for (let n = 0; n < chars.length; n++) {
        const testLine = line + chars[n];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, x, currentY);
          line = chars[n];
          currentY += lHeight;
          totalLines++;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
      currentY += lHeight;
      totalLines++;
    }
    return totalLines;
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (theme === 'classic') drawClassic(ctx);
    else if (theme === 'polaroid') drawPolaroid(ctx);
    else if (theme === 'cinema') drawCinema(ctx);
  }, [theme, lyric, fontSize, lineHeight, textOffsetY, showWatermark, img, transform]);

  useEffect(() => {
    draw();
  }, [draw]);

  const drawClassic = (ctx: CanvasRenderingContext2D) => {
    const config = THEME_DEFAULTS.classic;
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(0, 0, 600, 800);

    if (img) {
      ctx.save();
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.scale, transform.scale);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    }

    ctx.fillStyle = config.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${fontSize}px "${config.fontFace}", sans-serif`;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    const startY = 320 + textOffsetY;
    wrapText(ctx, lyric.content, 300, startY, 450, lineHeight);

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#dddddd';
    ctx.font = '22px sans-serif';
    ctx.fillText(`—— ${lyric.song} ——`, 300, 580 + textOffsetY);
    ctx.font = '16px sans-serif';
    ctx.fillText(`Album: ${lyric.album}`, 300, 615 + textOffsetY);

    if (showWatermark) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'normal 12px "Courier New", monospace';
      ctx.fillText('E  A  S  O  N     M  O  M  E  N  T     D  A  I  L  Y', 300, 780);
    }
  };

  const drawPolaroid = (ctx: CanvasRenderingContext2D) => {
    const config = THEME_DEFAULTS.polaroid;
    ctx.fillStyle = '#fdfdfd';
    ctx.fillRect(0, 0, 600, 800);

    const area = getDrawingArea('polaroid');
    ctx.save();
    ctx.beginPath();
    ctx.rect(area.x, area.y, area.w, area.h);
    ctx.clip();
    if (img) {
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.scale, transform.scale);
      ctx.drawImage(img, 0, 0);
    }
    ctx.restore();

    ctx.strokeStyle = '#f0f0f0';
    ctx.strokeRect(area.x, area.y, area.w, area.h);

    const textStartY = area.y + area.h + 35 + textOffsetY;
    ctx.fillStyle = config.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `normal ${fontSize}px "${config.fontFace}", serif`;

    const linesDrawn = wrapText(ctx, lyric.content, 300, textStartY, 510, lineHeight);

    ctx.fillStyle = '#777777';
    ctx.textAlign = 'right';
    ctx.font = 'italic 18px serif';
    ctx.fillText(
      `—— ${lyric.song} · ${lyric.album}`,
      550,
      textStartY + linesDrawn * lineHeight + 15,
    );

    if (showWatermark) {
      ctx.textAlign = 'center';
      ctx.font = 'normal 10px "Courier New", monospace';
      ctx.fillText('S  H  O  T     O  N     E  A  S  O  N     M  O  M  E  N  T', 300, 780);
    }
  };

  const drawCinema = (ctx: CanvasRenderingContext2D) => {
    const config = THEME_DEFAULTS.cinema;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 600, 800);

    const area = getDrawingArea('cinema');
    ctx.save();
    ctx.beginPath();
    ctx.rect(area.x, area.y, area.w, area.h);
    ctx.clip();
    if (img) {
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.scale, transform.scale);
      ctx.drawImage(img, 0, 0);
    }
    ctx.restore();

    ctx.fillStyle = config.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = `normal ${fontSize}px sans-serif`;

    // Cinema mode also splits by spaces
    const lines = lyric.content.split(/[\n\r\s]+/);
    let currentY = area.y + area.h - 30 + textOffsetY;
    for (let i = lines.length - 1; i >= 0; i--) {
      ctx.strokeText(lines[i], 300, currentY);
      ctx.fillText(lines[i], 300, currentY);
      currentY -= lineHeight;
    }

    ctx.fillStyle = '#bbbbbb';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${lyric.song} - ${lyric.album}`, 300, 750);

    if (showWatermark) {
      ctx.font = 'normal 10px "Courier New", monospace';
      ctx.fillText('P R E S E N T E D   B Y   E A S O N   M O M E N T', 300, 780);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.nativeEvent.offsetX - lastMousePos.x;
    const dy = e.nativeEvent.offsetY - lastMousePos.y;
    setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform((prev) => ({ ...prev, scale: prev.scale * delta }));
  };

  const handleThemeChange = (newTheme: 'classic' | 'polaroid' | 'cinema') => {
    setTheme(newTheme);
    const defaults = THEME_DEFAULTS[newTheme];
    setFontSize(defaults.fontSize);
    setLineHeight(defaults.lineHeight);
    setTextOffsetY(0);
    if (img) fitImageToLayout(img, newTheme);
  };

  const handleExport = () => {
    if (isExporting) return;
    setIsExporting(true);

    // Simulate generating delay for better UX
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        setIsExporting(false);
        return;
      }
      const dataUrl = canvas.toDataURL('image/png');

      if ((window as any).ipcRenderer) {
        (window as any).ipcRenderer.send('save-poster', dataUrl);
      }

      // Reset state after a short while or listen for main process reply
      setTimeout(() => setIsExporting(false), 1000);
    }, 1500);
  };

  const getThemeLabel = (t: string) => {
    switch (t) {
      case 'classic':
        return '经典';
      case 'polaroid':
        return '拍立得';
      case 'cinema':
        return '电影感';
      default:
        return t;
    }
  };

  const resetTypography = () => {
    const defaults = THEME_DEFAULTS[theme];
    setFontSize(defaults.fontSize);
    setLineHeight(defaults.lineHeight);
    setTextOffsetY(0);
  };

  return (
    <div className="app-container">
      {/* Draggable Titlebar Region for macOS */}
      <div className="titlebar-drag-region" />

      {/* Left Workspace: Canvas */}
      <div className="workspace">
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={600}
            height={800}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              height: '80vh' /* Scale to fit viewport height */,
              width: 'auto',
              display: 'block',
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
                className={`loading-icon ${animationType === 'rotate' ? 'rotate' : ''}`}
                alt="Loading"
              />
              <div className="loading-text">正在生成海报...</div>
            </div>
          )}
        </div>
      </div>

      {/* Right Inspector: Controls */}
      <aside className="inspector">
        <div className="inspector-header">
          <h2 className="inspector-title">海报设置</h2>
        </div>

        <div className="scroll-content">
          {/* Theme Section */}
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
                  onClick={() => handleThemeChange(t)}
                  className={`theme-card ${theme === t ? 'active' : ''}`}
                >
                  {getThemeLabel(t)}
                </div>
              ))}
            </div>
          </div>

          {/* Lyric Section */}
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

          {/* Typography Section */}
          <div className="control-group">
            <div className="label-row">
              <span className="control-label">
                <Settings size={14} /> 排版样式
              </span>
              <button className="btn-icon" onClick={resetTypography} title="重置排版参数">
                <RefreshCw size={14} />
              </button>
            </div>

            <div>
              <div className="label-row" style={{ marginBottom: 4 }}>
                <span className="control-value">字体大小</span>
                <span className="control-value">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="100"
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
                min="20"
                max="150"
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
                min="-300"
                max="300"
                value={textOffsetY}
                onChange={(e) => setTextOffsetY(parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Image & Extras */}
          <div className="control-group">
            <div className="label-row">
              <span className="control-label">
                <ImageIcon size={14} /> 背景图片
              </span>
              <button
                className="btn-icon"
                onClick={() => img && fitImageToLayout(img, theme)}
                title="重置布局"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="upload-trigger" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon size={24} color="#007AFF" />
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

            <label className="checkbox-wrapper" style={{ marginTop: 8 }}>
              <input
                type="checkbox"
                checked={showWatermark}
                onChange={(e) => setShowWatermark(e.target.checked)}
              />
              <span className="control-value">显示 Eason Moment 水印</span>
            </label>
          </div>

          {/* Export Preferences */}
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
        </div>

        <div className="inspector-footer">
          <button
            className="btn-primary"
            onClick={handleExport}
            disabled={isExporting}
            style={{ opacity: isExporting ? 0.7 : 1, cursor: isExporting ? 'wait' : 'pointer' }}
          >
            {isExporting ? '生成中...' : '导出海报'}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default PosterGenerator;
