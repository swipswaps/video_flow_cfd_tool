import React, { useRef, useEffect } from 'react';
import type { Vector } from '../types';
import { DEFAULT_GRID_WIDTH } from '../constants';

type ROI = { x: number; y: number; width: number; height: number; };
type ROIRect = { x: number; y: number; width: number; height: number; };

interface VectorFieldDisplayProps {
    vectorField: Vector[][];
    backgroundImage: string;
    density: number;
    scale: number;
    displayMode: 'vectors' | 'streamlines' | 'heatmap';
    roi: ROI | null;
}

const roundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
};

const drawLegend = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const legendWidth = 180;
    const legendHeight = 80;
    const padding = 15;
    const x = canvasWidth - legendWidth - padding;
    const y = canvasHeight - legendHeight - padding;
    const barHeight = 15;

    ctx.save();
    ctx.fillStyle = 'rgba(26, 32, 44, 0.85)';
    ctx.strokeStyle = 'rgba(74, 85, 104, 0.9)';
    ctx.lineWidth = 1.5;
    roundedRect(ctx, x, y, legendWidth, legendHeight, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#E5E7EB';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Velocity Magnitude', x + legendWidth / 2, y + padding + 8);

    const barX = x + padding;
    const barY = y + padding + 25;
    const barWidth = legendWidth - 2 * padding;
    const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    
    gradient.addColorStop(0, 'hsl(240, 100%, 70%)');
    gradient.addColorStop(0.25, 'hsl(180, 100%, 70%)');
    gradient.addColorStop(0.5, 'hsl(120, 100%, 70%)');
    gradient.addColorStop(0.75, 'hsl(60, 100%, 70%)');
    gradient.addColorStop(1, 'hsl(0, 100%, 70%)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = '#D1D5DB';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'start';
    ctx.fillText('Low', barX, barY + barHeight + 15);
    ctx.textAlign = 'end';
    ctx.fillText('High', barX + barWidth, barY + barHeight + 15);
};

const getColorForMagnitude = (normalizedMagnitude: number, opacity: number = 0.9): string => {
    const hue = 240 - normalizedMagnitude * 240;
    return `hsla(${hue}, 100%, 70%, ${opacity})`;
};

const getInterpolatedVector = (p: {x: number, y: number}, field: Vector[][]): Vector => {
    const gridHeight = field.length;
    const gridWidth = field[0].length;
    const x = Math.max(0, Math.min(p.x, gridWidth - 1.001));
    const y = Math.max(0, Math.min(p.y, gridHeight - 1.001));
    const x0 = Math.floor(x); const x1 = x0 + 1;
    const y0 = Math.floor(y); const y1 = y0 + 1;
    const v00 = field[y0][x0]; const v01 = field[y0][x1];
    const v10 = field[y1][x0]; const v11 = field[y1][x1];
    const wx = x - x0; const wy = y - y0;
    const u = (v00.u * (1 - wx) * (1 - wy)) + (v01.u * wx * (1 - wy)) + (v10.u * (1 - wx) * wy) + (v11.u * wx * wy);
    const v = (v00.v * (1 - wx) * (1 - wy)) + (v01.v * wx * (1 - wy)) + (v10.v * (1 - wx) * wy) + (v11.v * wx * wy);
    return { u, v };
};

type DrawProps = {
    vectorField: Vector[][];
    maxMagnitude: number;
    roiRect: ROIRect;
    density: number;
    scale: number;
};

const drawVectors = (ctx: CanvasRenderingContext2D, props: DrawProps) => {
    const { vectorField, maxMagnitude, roiRect, density, scale } = props;
    const gridHeight = vectorField.length;
    const gridWidth = vectorField[0].length;
    const cellWidth = roiRect.width / gridWidth;
    const cellHeight = roiRect.height / gridHeight;
    const step = Math.max(1, Math.round(gridWidth / density));
    const arrowScaleFactor = Math.min(cellWidth, cellHeight) * 0.9 * scale;

    for (let y = 0; y < gridHeight; y += step) {
        for (let x = 0; x < gridWidth; x += step) {
            const vec = vectorField[y][x];
            const magnitude = Math.sqrt(vec.u * vec.u + vec.v * vec.v);
            if (magnitude < 1e-6) continue;
            const centerX = roiRect.x + x * cellWidth + cellWidth / 2;
            const centerY = roiRect.y + y * cellHeight + cellHeight / 2;
            const normalizedMagnitude = magnitude / maxMagnitude;
            const color = getColorForMagnitude(normalizedMagnitude, 0.95);
            const angle = Math.atan2(vec.v, vec.u);
            const length = normalizedMagnitude * arrowScaleFactor;
            ctx.strokeStyle = color; ctx.fillStyle = color;
            ctx.lineWidth = Math.max(1.5, normalizedMagnitude * 3.5);
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle);
            ctx.beginPath(); ctx.moveTo(-length / 2, 0); ctx.lineTo(length / 2, 0); ctx.stroke();
            const arrowHeadSize = Math.min(length / 2, 8) * (0.8 + normalizedMagnitude * 0.2);
            ctx.beginPath(); ctx.moveTo(length / 2, 0); ctx.lineTo(length / 2 - arrowHeadSize, -arrowHeadSize * 0.5); ctx.lineTo(length / 2 - arrowHeadSize, arrowHeadSize * 0.5); ctx.closePath(); ctx.fill();
            ctx.restore();
        }
    }
};

const drawStreamlines = (ctx: CanvasRenderingContext2D, props: DrawProps) => {
    const { vectorField, maxMagnitude, roiRect, density } = props;
    const gridHeight = vectorField.length;
    const gridWidth = vectorField[0].length;
    const numLines = density * 2;
    const streamLineSteps = 60;
    const stepLength = Math.min(roiRect.width, roiRect.height) / (numLines * 2);
    ctx.lineWidth = 1.8;

    for (let i = 0; i < numLines; i++) {
        for (let j = 0; j < numLines; j++) {
            const startX = roiRect.x + (i + 0.5) * (roiRect.width / numLines);
            const startY = roiRect.y + (j + 0.5) * (roiRect.height / numLines);
            let px = startX; let py = startY;
            const gridX = (px - roiRect.x) / roiRect.width * (gridWidth - 1);
            const gridY = (py - roiRect.y) / roiRect.height * (gridHeight - 1);
            const startVec = getInterpolatedVector({ x: gridX, y: gridY }, vectorField);
            const magnitude = Math.sqrt(startVec.u * startVec.u + startVec.v * startVec.v);
            ctx.strokeStyle = getColorForMagnitude(magnitude / maxMagnitude, 0.75);
            ctx.beginPath(); ctx.moveTo(px, py);

            for (let step = 0; step < streamLineSteps; step++) {
                if (px < roiRect.x || px > roiRect.x + roiRect.width || py < roiRect.y || py > roiRect.y + roiRect.height) break;
                const currentGridX = (px - roiRect.x) / roiRect.width * (gridWidth - 1);
                const currentGridY = (py - roiRect.y) / roiRect.height * (gridHeight - 1);
                const vec = getInterpolatedVector({ x: currentGridX, y: currentGridY }, vectorField);
                const mag = Math.sqrt(vec.u * vec.u + vec.v * vec.v);
                if (mag < 1e-6) break;
                px += vec.u / mag * stepLength;
                py += vec.v / mag * stepLength;
                ctx.lineTo(px, py);
            }
            ctx.stroke();
        }
    }
};

const drawHeatmap = (ctx: CanvasRenderingContext2D, props: DrawProps) => {
    const { vectorField, maxMagnitude, roiRect } = props;
    const gridHeight = vectorField.length;
    const gridWidth = vectorField[0].length;
    const cellWidth = roiRect.width / gridWidth;
    const cellHeight = roiRect.height / gridHeight;

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const vec = vectorField[y][x];
            const magnitude = Math.sqrt(vec.u * vec.u + vec.v * vec.v);
            const normalizedMagnitude = magnitude / maxMagnitude;
            ctx.fillStyle = getColorForMagnitude(normalizedMagnitude, 0.65);
            ctx.fillRect(roiRect.x + x * cellWidth, roiRect.y + y * cellHeight, cellWidth, cellHeight);
        }
    }
};

export const VectorFieldDisplay: React.FC<VectorFieldDisplayProps> = ({ vectorField, backgroundImage, density, scale, displayMode, roi }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.src = backgroundImage;
        img.onload = () => {
            const aspectRatio = img.width / img.height;
            const canvasWidth = canvas.parentElement?.clientWidth || 800;
            const canvasHeight = canvasWidth / aspectRatio;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            if (vectorField && vectorField.length > 0 && vectorField[0].length > 0) {
                let maxMagnitude = 0;
                for (const row of vectorField) {
                    for (const vec of row) {
                        const magnitude = Math.sqrt(vec.u * vec.u + vec.v * vec.v);
                        if (magnitude > maxMagnitude) maxMagnitude = magnitude;
                    }
                }
                if (maxMagnitude === 0) maxMagnitude = 1;

                const roiRect: ROIRect = {
                    x: roi ? roi.x * canvas.width : 0,
                    y: roi ? roi.y * canvas.height : 0,
                    width: roi ? roi.width * canvas.width : canvas.width,
                    height: roi ? roi.height * canvas.height : canvas.height,
                };

                const drawProps: DrawProps = { vectorField, maxMagnitude, roiRect, density, scale };
                
                ctx.save();
                ctx.beginPath();
                ctx.rect(roiRect.x, roiRect.y, roiRect.width, roiRect.height);
                ctx.clip();

                switch (displayMode) {
                    case 'streamlines': drawStreamlines(ctx, drawProps); break;
                    case 'heatmap': drawHeatmap(ctx, drawProps); break;
                    case 'vectors': default: drawVectors(ctx, drawProps); break;
                }
                
                ctx.restore(); // Remove clip for legend drawing
            }
            
            drawLegend(ctx, canvas.width, canvas.height);
        };
        img.onerror = () => {
             console.error("Failed to load background image for canvas.");
        }

    }, [vectorField, backgroundImage, density, scale, displayMode, roi]);

    return (
        <div className="bg-black rounded-b-lg overflow-hidden aspect-video">
            <canvas ref={canvasRef} />
        </div>
    );
};