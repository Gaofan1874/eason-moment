import { SCALE, ThemeConfig, LyricData } from './constants';

export const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lHeight: number,
) => {
    const segments = text.split(/[\n\r\s]+/);  let currentY = y;
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
}

export const drawClassic = ({
  ctx, w, h, config, img, transform, imageFilter, lyric, textOffsetY, showWatermark
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
  wrapText(ctx, lyric.content, w / 2, startY, maxWidth, config.lineHeight);

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
  ctx, w, h, config, img, transform, imageFilter, lyric, textOffsetY, showWatermark, getDrawingArea
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

  const linesDrawn = wrapText(ctx, lyric.content, w / 2, textStartY, w * 0.8, config.lineHeight);

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
  ctx, w, h, config, img, transform, imageFilter, lyric, textOffsetY, showWatermark, getDrawingArea
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

  const lines = lyric.content.split(/[\n\r\s]+/);
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
