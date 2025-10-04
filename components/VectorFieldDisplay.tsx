import React, { useRef, useEffect } from 'react';
import type { Vector } from '../types';

interface VectorFieldDisplayProps {
    vectorField: Vector[][];
    backgroundImage: string;
}

/**
 * Draws a rounded rectangle path for the legend background.
 * @param ctx The canvas rendering context.
 * @param x The top-left x-coordinate.
 * @param y The top-left y-coordinate.
 * @param width The width of the rectangle.
 * @param height The height of the rectangle.
 * @param radius The corner radius.
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
 * @param ctx The canvas rendering context.
 * @param canvasWidth The width of the canvas.
 * @param canvasHeight The height of the canvas.
 */
const drawLegend = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const legendWidth = 180;
    const legendHeight = 80;
    const padding = 15;
    const x = canvasWidth - legendWidth - padding;
    const y = canvasHeight - legendHeight - padding;
    const barHeight = 15;

    // Draw the semi-transparent background with rounded corners
    ctx.save();
    ctx.fillStyle = 'rgba(26, 32, 44, 0.85)'; // bg-gray-900 with opacity
    ctx.strokeStyle = 'rgba(74, 85, 104, 0.9)'; // border-gray-600
    ctx.lineWidth = 1.5;
    roundedRect(ctx, x, y, legendWidth, legendHeight, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Title
    ctx.fillStyle = '#E5E7EB'; // text-gray-200
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Velocity Magnitude', x + legendWidth / 2, y + padding + 8);

    // Gradient Bar
    const barX = x + padding;
    const barY = y + padding + 25;
    const barWidth = legendWidth - 2 * padding;
    const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    
    // This hue gradient (240=blue -> 0=red) perfectly matches the vector color calculation
    gradient.addColorStop(0, 'hsl(240, 100%, 70%)');      // Blue
    gradient.addColorStop(0.25, 'hsl(180, 100%, 70%)');   // Cyan
    gradient.addColorStop(0.5, 'hsl(120, 100%, 70%)');    // Green
    gradient.addColorStop(0.75, 'hsl(60, 100%, 70%)');    // Yellow
    gradient.addColorStop(1, 'hsl(0, 100%, 70%)');        // Red
    
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Labels
    ctx.fillStyle = '#D1D5DB'; // text-gray-300
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'start';
    ctx.fillText('Low', barX, barY + barHeight + 15);
    ctx.textAlign = 'end';
    ctx.fillText('High', barX + barWidth, barY + barHeight + 15);
};

export const VectorFieldDisplay: React.FC<VectorFieldDisplayProps> = ({ vectorField, backgroundImage }) => {
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

                // Find max magnitude for normalization
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

                const arrowScale = Math.min(cellWidth, cellHeight) * 0.7;

                for (let y = 0; y < gridHeight; y++) {
                    for (let x = 0; x < gridWidth; x++) {
                        const vec = vectorField[y][x];
                        const magnitude = Math.sqrt(vec.u * vec.u + vec.v * vec.v);
                        
                        if (magnitude < 1e-6) continue; // Don't draw zero vectors

                        const centerX = x * cellWidth + cellWidth / 2;
                        const centerY = y * cellHeight + cellHeight / 2;

                        const angle = Math.atan2(vec.v, vec.u);
                        const length = (magnitude / maxMagnitude) * arrowScale;

                        // Color based on magnitude. Hue from 240 (blue) to 0 (red).
                        const hue = 240 - (magnitude / maxMagnitude) * 240; 
                        ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.9)`;
                        ctx.fillStyle = `hsla(${hue}, 100%, 70%, 0.9)`;
                        ctx.lineWidth = Math.max(1, (magnitude/maxMagnitude) * 3);

                        ctx.save();
                        ctx.translate(centerX, centerY);
                        ctx.rotate(angle);

                        // Draw arrow line
                        ctx.beginPath();
                        ctx.moveTo(-length / 2, 0);
                        ctx.lineTo(length / 2, 0);
                        ctx.stroke();

                        // Draw arrowhead
                        ctx.beginPath();
                        ctx.moveTo(length / 2, 0);
                        ctx.lineTo(length / 2 - 6, -3);
                        ctx.lineTo(length / 2 - 6, 3);
                        ctx.closePath();
                        ctx.fill();

                        ctx.restore();
                    }
                }
            }
            
            // Draw the legend on top, regardless of whether vectors were drawn
            drawLegend(ctx, canvas.width, canvas.height);
        };
        img.onerror = () => {
             console.error("Failed to load background image for canvas.");
        }

    }, [vectorField, backgroundImage]);

    return (
        <div className="bg-black rounded-lg overflow-hidden aspect-video">
            <canvas ref={canvasRef} />
        </div>
    );
};
