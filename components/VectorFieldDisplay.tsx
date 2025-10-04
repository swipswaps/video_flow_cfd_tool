import React, { useRef, useEffect } from 'react';
import type { Vector } from '../types';
import { GRID_WIDTH } from '../constants';

interface VectorFieldDisplayProps {
    vectorField: Vector[][];
    backgroundImage: string;
    density: number;
    scale: number;
}

/**
 * Draws a rounded rectangle path for the legend background.
 */
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

/**
 * Draws the color gradient legend on the canvas.
 */
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

/**
 * Calculates the color for a vector based on its normalized magnitude.
 * The color ranges from blue (low magnitude) to red (high magnitude), matching the legend.
 * @param normalizedMagnitude A value from 0 to 1.
 * @returns An HSLA color string.
 */
const getColorForMagnitude = (normalizedMagnitude: number): string => {
    // Hue ranges from 240 (blue) down to 0 (red)
    const hue = 240 - normalizedMagnitude * 240;
    return `hsla(${hue}, 100%, 70%, 0.9)`;
};


export const VectorFieldDisplay: React.FC<VectorFieldDisplayProps> = ({ vectorField, backgroundImage, density, scale }) => {
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
                const gridHeight = vectorField.length;
                const gridWidth = vectorField[0].length;
                const cellWidth = canvas.width / gridWidth;
                const cellHeight = canvas.height / gridHeight;

                let maxMagnitude = 0;
                for (let y = 0; y < gridHeight; y++) {
                    for (let x = 0; x < gridWidth; x++) {
                        const vec = vectorField[y][x];
                        const magnitude = Math.sqrt(vec.u * vec.u + vec.v * vec.v);
                        if (magnitude > maxMagnitude) {
                            maxMagnitude = magnitude;
                        }
                    }
                }
                if (maxMagnitude === 0) maxMagnitude = 1;

                // Use density to determine the step size for drawing vectors
                const step = Math.max(1, Math.round(GRID_WIDTH / density));
                
                // Use scale to adjust the arrow length
                const arrowScale = Math.min(cellWidth, cellHeight) * 0.9 * scale;

                for (let y = 0; y < gridHeight; y += step) {
                    for (let x = 0; x < gridWidth; x += step) {
                        const vec = vectorField[y][x];
                        const magnitude = Math.sqrt(vec.u * vec.u + vec.v * vec.v);
                        
                        if (magnitude < 1e-6) continue;

                        const centerX = x * cellWidth + cellWidth / 2;
                        const centerY = y * cellHeight + cellHeight / 2;

                        const normalizedMagnitude = magnitude / maxMagnitude;
                        const color = getColorForMagnitude(normalizedMagnitude);
                        const angle = Math.atan2(vec.v, vec.u);
                        const length = normalizedMagnitude * arrowScale;

                        ctx.strokeStyle = color;
                        ctx.fillStyle = color;
                        ctx.lineWidth = Math.max(1, normalizedMagnitude * 3);

                        ctx.save();
                        ctx.translate(centerX, centerY);
                        ctx.rotate(angle);

                        ctx.beginPath();
                        ctx.moveTo(-length / 2, 0);
                        ctx.lineTo(length / 2, 0);
                        ctx.stroke();

                        ctx.beginPath();
                        const arrowHeadSize = Math.min(length/2, 6)
                        ctx.moveTo(length / 2, 0);
                        ctx.lineTo(length / 2 - arrowHeadSize, -arrowHeadSize * 0.5);
                        ctx.lineTo(length / 2 - arrowHeadSize, arrowHeadSize * 0.5);
                        ctx.closePath();
                        ctx.fill();

                        ctx.restore();
                    }
                }
            }
            
            drawLegend(ctx, canvas.width, canvas.height);
        };
        img.onerror = () => {
             console.error("Failed to load background image for canvas.");
        }

    }, [vectorField, backgroundImage, density, scale]);

    return (
        <div className="bg-black rounded-b-lg overflow-hidden aspect-video">
            <canvas ref={canvasRef} />
        </div>
    );
};
