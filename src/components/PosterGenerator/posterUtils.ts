import { SCALE, ThemeConfig, LyricData } from './constants';

export const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lHeight: number,
  mergeSpaces: boolean = false,
) => {
  let currentY = y;
  let totalLines = 0;

  if (mergeSpaces) {
    // Split only by explicit newlines
    const paragraphs = text.split(/\r?\n/);
    
    for (const paragraph of paragraphs) {
      const chars = paragraph.split('');
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
  } else {
    // Original behavior: split by newline AND space
    const segments = text.split(/[\n\r\s]+/);
    
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
  }
  return totalLines;
};

interface DrawParams {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  config: ThemeConfig; // Passed from parent state to override defaults
  img: HTMLImageElement | null;
  transform: { x: number; y: number; scale: number };
  imageFilter: string;
  lyric: LyricData;
  textOffsetY: number;
  showWatermark: boolean;
  getDrawingArea: (theme: string, w: number, h: number) => { x: number, y: number, w: number, h: number };
  mergeSpaces?: boolean;
}

export const drawClassic = ({
  ctx, w, h, config, img, transform, imageFilter, lyric, textOffsetY, showWatermark, mergeSpaces
}: DrawParams) => {
  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(0, 0, w, h);

  if (img) {
    ctx.save();
    ctx.filter = imageFilter;
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }

  ctx.fillStyle = config.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${config.fontSize}px ${config.fontFace}, sans-serif`;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 6 * SCALE;
  ctx.shadowOffsetX = 2 * SCALE;
  ctx.shadowOffsetY = 2 * SCALE;

  const startY = (h * 0.4) + textOffsetY;
  const maxWidth = w * 0.8;
  wrapText(ctx, lyric.content, w / 2, startY, maxWidth, config.lineHeight, mergeSpaces);

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#dddddd';
  ctx.font = `${22 * SCALE}px sans-serif`;
  const footerY = h - (h * 0.25) + textOffsetY;
  ctx.fillText(`—— ${lyric.song} ——`, w / 2, footerY);
  
  ctx.font = `${16 * SCALE}px sans-serif`;
  ctx.fillText(`Album: ${lyric.album}`, w / 2, footerY + (35 * SCALE));

  if (showWatermark) {
    ctx.fillStyle = '#FFD700';
    ctx.font = `normal ${12 * SCALE}px "Courier New", monospace`;
    ctx.fillText('E  A  S  O  N     M  O  M  E  N  T     D  A  I  L  Y', w / 2, h - (20 * SCALE));
  }
};

export const drawPolaroid = ({
  ctx, w, h, config, img, transform, imageFilter, lyric, textOffsetY, showWatermark, getDrawingArea, mergeSpaces
}: DrawParams) => {
  ctx.fillStyle = '#fdfdfd';
  ctx.fillRect(0, 0, w, h);

  const area = getDrawingArea('polaroid', w, h);
  
  ctx.save();
  ctx.beginPath();
  ctx.rect(area.x, area.y, area.w, area.h);
  ctx.clip();
  if (img) {
    ctx.filter = imageFilter;
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.drawImage(img, 0, 0);
  }
  ctx.restore();

  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 1 * SCALE;
  ctx.strokeRect(area.x, area.y, area.w, area.h);

  const textStartY = area.y + area.h + (35 * SCALE) + textOffsetY;
  ctx.fillStyle = config.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `normal ${config.fontSize}px ${config.fontFace}, serif`;

  const linesDrawn = wrapText(ctx, lyric.content, w / 2, textStartY, w * 0.8, config.lineHeight, mergeSpaces);

  ctx.fillStyle = '#777777';
  ctx.textAlign = 'right';
  ctx.font = `italic ${18 * SCALE}px serif`;
  
  const footerY = textStartY + linesDrawn * config.lineHeight + (15 * SCALE);
  ctx.fillText(
    `—— ${lyric.song} · ${lyric.album}`,
    w - (w * 0.1),
    footerY,
  );

  if (showWatermark) {
    ctx.textAlign = 'center';
    ctx.font = `normal ${10 * SCALE}px "Courier New", monospace`;
    ctx.fillText('S  H  O  T     O  N     E  A  S  O  N     M  O  M  E  N  T', w / 2, h - (20 * SCALE));
  }
};

export const drawCinema = ({
  ctx, w, h, config, img, transform, imageFilter, lyric, textOffsetY, showWatermark, getDrawingArea, mergeSpaces
}: DrawParams) => {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);

  const area = getDrawingArea('cinema', w, h);
  
  ctx.save();
  ctx.beginPath();
  ctx.rect(area.x, area.y, area.w, area.h);
  ctx.clip();
  if (img) {
    ctx.filter = imageFilter;
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.drawImage(img, 0, 0);
  }
  ctx.restore();

  ctx.fillStyle = config.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.font = `normal ${config.fontSize}px ${config.fontFace}, sans-serif`;
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.lineWidth = 3 * SCALE;

  // Cinema mode needs special handling because it draws bottom-up usually or specific layout
  // The original code split by regex and drew bottom-up
  // Let's adapt it to support mergeSpaces
  
  let lines: string[] = [];
  if (mergeSpaces) {
     // Split by newline, then wrap each line manually to form a list of lines?
     // Since drawCinema iterates backwards, we need pre-wrapped lines.
     // Let's do a quick wrap simulation to get lines
     const paragraphs = lyric.content.split(/\r?\n/);
     paragraphs.forEach(para => {
        const chars = para.split('');
        let line = '';
        const maxWidth = w * 0.9; // Cinema usually full widthish
        
        for (let n = 0; n < chars.length; n++) {
           const testLine = line + chars[n];
           const metrics = ctx.measureText(testLine);
           if (metrics.width > maxWidth && n > 0) {
              lines.push(line);
              line = chars[n];
           } else {
              line = testLine;
           }
        }
        if (line) lines.push(line);
     });
  } else {
     lines = lyric.content.split(/[\n\r\s]+/);
  }

  let currentY = area.y + area.h - (30 * SCALE) + textOffsetY;
  
  for (let i = lines.length - 1; i >= 0; i--) {
    ctx.strokeText(lines[i], w / 2, currentY);
    ctx.fillText(lines[i], w / 2, currentY);
    currentY -= config.lineHeight;
  }

  ctx.fillStyle = '#bbbbbb';
  ctx.font = `${12 * SCALE}px sans-serif`;
  ctx.strokeStyle = 'transparent';
  const bottomBarCenter = h - ((h - (area.y + area.h)) / 2);
  ctx.fillText(`${lyric.song} - ${lyric.album}`, w / 2, bottomBarCenter);

  if (showWatermark) {
    ctx.fillStyle = '#eeeeee'; 
    ctx.textAlign = 'center';
    ctx.font = `normal ${10 * SCALE}px "Courier New", monospace`;
    ctx.fillText('P R E S E N T E D   B Y   E A S O N   M O M E N T', w / 2, h - (10 * SCALE));
  }
};

export const drawVertical = ({
  ctx, w, h, config, img, transform, imageFilter, lyric, textOffsetY, showWatermark, mergeSpaces
}: DrawParams) => {
  // 1. Background (Black)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);

  // 2. Image Layer
  if (img) {
    ctx.save();
    ctx.filter = imageFilter;
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }

  // 3. Gradients (Overlay)
  // Right gradient for vertical lyrics visibility
  const gradientWidth = w * 0.5; // Cover half width to ensure readability
  const rightGrad = ctx.createLinearGradient(w, 0, w - gradientWidth, 0);
  rightGrad.addColorStop(0, 'rgba(0,0,0,0.85)');
  rightGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rightGrad;
  ctx.fillRect(w - gradientWidth, 0, gradientWidth, h);

  // Top gradient
  const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.25);
  topGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
  topGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, w, h * 0.25);

  // Bottom gradient
  const bGrad = ctx.createLinearGradient(0, h, 0, h - (h * 0.25));
  bGrad.addColorStop(0, 'rgba(0,0,0,0.8)');
  bGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bGrad;
  ctx.fillRect(0, h - (h * 0.25), w, h * 0.25);

  // 4. Header: Song Title
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  // Use Armor Mincho for consistency
  ctx.font = `bold ${22 * SCALE}px "Armor Mincho", serif`; 
  
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  const headerX = 40 * SCALE;
  const headerY = 40 * SCALE;
  ctx.fillText(`陈奕迅《${lyric.song}》`, headerX, headerY);

  // 5. Vertical Lyrics
  ctx.font = `${config.fontSize}px ${config.fontFace}`;
  ctx.fillStyle = config.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top'; // Changed from middle to top for better top alignment
  
  ctx.shadowBlur = 4;
  ctx.shadowColor = 'rgba(0,0,0,0.9)';

  // Determine split logic based on mergeSpaces
  const lines = mergeSpaces 
    ? lyric.content.split(/\r?\n/) 
    : lyric.content.split(/[\n\r\s]+/);
  
  // Start from right side
  let currentX = w - (100 * SCALE); 
  const baseStartY = h * 0.22 + textOffsetY;
  
  lines.forEach((line) => {
    if (!line.trim() && !mergeSpaces) return; 

    // Removed staggerOffset to ensure "顶部对齐" (Top alignment)
    let currentY = baseStartY;
    
    const chars = line.split('');
    chars.forEach(char => {
        ctx.fillText(char, currentX, currentY);
        // Vertical spacing: 1.1 times font size for better readability
        currentY += config.fontSize * 1.1; 
    });
    
    // Move left for next line: using lineHeight from config
    currentX -= config.lineHeight;
  });

  // 6. Footer: Credits (Lyricist, Composer, Album)
  ctx.shadowColor = 'transparent'; 
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.font = `normal ${15 * SCALE}px "Armor Mincho", serif`;
  ctx.fillStyle = '#dddddd';
  
  const footerY = h - (45 * SCALE);
  const parts = [];
  if (lyric.lyricist) parts.push(`词：${lyric.lyricist}`);
  if (lyric.composer) parts.push(`曲：${lyric.composer}`);
  if (lyric.album) parts.push(`专辑：《${lyric.album}》`);
  
  const footerText = parts.join('    '); // Use extra spaces as spacers
  ctx.fillText(footerText, w / 2, footerY);

  // 7. Watermark
  if (showWatermark) {
    ctx.textAlign = 'right';
    ctx.font = `italic ${12 * SCALE}px "Times New Roman", serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('@Eason Moment', w - (30 * SCALE), h - (20 * SCALE));
  }
};
