
import React, { useRef, useEffect } from 'react';
import type { Vector } from '../types';

interface VectorFieldDisplayProps {
    vectorField: Vector[][];
    backgroundImage: string;
}

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

            if (!vectorField || vectorField.length === 0) return;

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

                    // Color based on magnitude
                    const hue = 240 - (magnitude / maxMagnitude) * 240; // blue (0) to red (240)
                    ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.9)`;
                    ctx.fillStyle = `hsla(${hue}, 100%, 70%, 0.9)`;
                    ctx.lineWidth = Math.max(1, (magnitude/maxMagnitude) * 3);

                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.rotate(angle);

                    // Draw arrow
                    ctx.beginPath();
                    ctx.moveTo(-length / 2, 0);
                    ctx.lineTo(length / 2, 0);
                    ctx.stroke();

                    // Arrowhead
                    ctx.beginPath();
                    ctx.moveTo(length / 2, 0);
                    ctx.lineTo(length / 2 - 6, -3);
                    ctx.lineTo(length / 2 - 6, 3);
                    ctx.closePath();
                    ctx.fill();

                    ctx.restore();
                }
            }
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
