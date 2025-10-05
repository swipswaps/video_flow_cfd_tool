import React, { useState, useRef, useEffect } from 'react';
import { MAX_CLIP_DURATION_S } from '../constants';

type ROI = { x: number; y: number; width: number; height: number; };

interface VideoTrimmerProps {
    src: string;
    onCalculate: (videoElement: HTMLVideoElement, startTime: number, endTime: number) => void;
    isCalculating: boolean;
    roi: ROI | null;
    setRoi: (roi: ROI | null) => void;
    gridWidth: number;
    setGridWidth: (width: number) => void;
    gridHeight: number;
    setGridHeight: (height: number) => void;
}

const IconScissors = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);
const IconPlay = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> );
const IconPause = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> );
const IconCalculate = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" /><path fillRule="evenodd" d="M13.5 3a1.5 1.5 0 00-1.423 1.03l-2.437 6.1a1.5 1.5 0 00.126 1.487l2.06 2.747a1.5 1.5 0 002.348-.123l.107-.179a1.5 1.5 0 00-2.083-2.31L13.5 9.5l1.638-4.1a1.5 1.5 0 00-1.638-1.9z" clipRule="evenodd" /></svg> );

const ROILayer: React.FC<{ roi: ROI | null, setRoi: (roi: ROI | null) => void }> = ({ roi, setRoi }) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentRect, setCurrentRect] = useState<ROI | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    const getRelativeCoords = (e: React.MouseEvent<HTMLDivElement>): { x: number, y: number } => {
        const rect = overlayRef.current!.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDrawing(true);
        const pos = getRelativeCoords(e);
        setStartPos(pos);
        setCurrentRect({ ...pos, width: 0, height: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDrawing) return;
        const currentPos = getRelativeCoords(e);
        const newRect: ROI = {
            x: Math.min(startPos.x, currentPos.x),
            y: Math.min(startPos.y, currentPos.y),
            width: Math.abs(currentPos.x - startPos.x),
            height: Math.abs(currentPos.y - startPos.y),
        };
        setCurrentRect(newRect);
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        if (currentRect && currentRect.width > 0.01 && currentRect.height > 0.01) {
            setRoi(currentRect);
        }
        setCurrentRect(null);
    };
    
    const displayRect = isDrawing ? currentRect : roi;

    return (
        <div 
            ref={overlayRef}
            className="absolute top-0 left-0 w-full h-full cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // Stop drawing if mouse leaves
        >
            {displayRect && (
                <div 
                    className="absolute border-2 border-dashed border-cyan-400 bg-cyan-400/20 pointer-events-none"
                    style={{
                        left: `${displayRect.x * 100}%`,
                        top: `${displayRect.y * 100}%`,
                        width: `${displayRect.width * 100}%`,
                        height: `${displayRect.height * 100}%`,
                    }}
                />
            )}
        </div>
    );
};


export const VideoTrimmer: React.FC<VideoTrimmerProps> = ({ src, onCalculate, isCalculating, roi, setRoi, gridWidth, setGridWidth, gridHeight, setGridHeight }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const clipDuration = endTime - startTime;
    const isClipValid = clipDuration > 0 && clipDuration <= MAX_CLIP_DURATION_S;

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const handleLoadedMetadata = () => {
            const videoDuration = video.duration;
            setDuration(videoDuration);
            const initialEndTime = Math.min(videoDuration, MAX_CLIP_DURATION_S);
            setStartTime(0); setEndTime(initialEndTime); setCurrentTime(0);
        };
        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        setStartTime(0); setEndTime(0); setCurrentTime(0); setIsPlaying(false);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('timeupdate', handleTimeUpdate);
        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [src]);

    const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStart = parseFloat(e.target.value);
        if (newStart < endTime) {
            setStartTime(newStart);
            if (endTime - newStart > MAX_CLIP_DURATION_S) {
                setEndTime(Math.min(duration, newStart + MAX_CLIP_DURATION_S));
            }
        }
    };
    
    const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEnd = parseFloat(e.target.value);
        if (newEnd > startTime) {
            setEndTime(newEnd);
            if (newEnd - startTime > MAX_CLIP_DURATION_S) {
                setStartTime(Math.max(0, newEnd - MAX_CLIP_DURATION_S));
            }
        }
    };

    const togglePlay = () => {
        const video = videoRef.current;
        if (video) {
            if (video.paused) { video.play(); setIsPlaying(true); } 
            else { video.pause(); setIsPlaying(false); }
        }
    };

    const handleCalculateClick = () => {
        if (videoRef.current && isClipValid) {
            onCalculate(videoRef.current, startTime, endTime);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center text-cyan-300 border-b border-gray-700 pb-3">2. Trim Clip & Calculate</h2>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg border border-gray-700">
                <video ref={videoRef} src={src} className="w-full h-full" controls={false} />
                <ROILayer roi={roi} setRoi={setRoi} />
            </div>

            <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-4">
                    <button onClick={togglePlay} className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                        {isPlaying ? <IconPause /> : <IconPlay />}
                    </button>
                    <div className="w-full relative h-10 flex items-center">
                        <input type="range" min="0" max={duration} value={currentTime} readOnly className="absolute w-full h-1.5 bg-gray-600 rounded-lg appearance-none pointer-events-none z-10" style={{ background: `linear-gradient(to right, #2dd4bf ${duration > 0 ? (currentTime / duration * 100) : 0}%, #4a5568 ${duration > 0 ? (currentTime / duration * 100) : 0}%)` }}/>
                        <div className="absolute w-full h-1.5 bg-transparent z-20" style={{ left: 0 }}>
                            <div className="absolute h-full bg-blue-500/50" style={{ left: `${duration > 0 ? (startTime / duration) * 100 : 0}%`, width: `${duration > 0 ? (clipDuration / duration) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                     <div className="text-sm font-mono whitespace-nowrap text-gray-300">
                        {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="start-time" className="block text-sm font-medium text-gray-400">Start Time: {startTime.toFixed(2)}s</label>
                    <input id="start-time" type="range" min="0" max={duration} step="0.01" value={startTime} onChange={handleStartTimeChange} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"/>
                </div>
                <div>
                    <label htmlFor="end-time" className="block text-sm font-medium text-gray-400">End Time: {endTime.toFixed(2)}s</label>
                    <input id="end-time" type="range" min="0" max={duration} step="0.01" value={endTime} onChange={handleEndTimeChange} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                </div>
            </div>

            <details className="bg-gray-700/30 p-4 rounded-lg transition-all duration-300 open:bg-gray-700/50">
                <summary className="text-lg font-semibold text-gray-300 cursor-pointer hover:text-white">Advanced Settings</summary>
                <div className="mt-4 grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="grid-width" className="block text-sm font-medium text-gray-400">Grid Width: {gridWidth}</label>
                        <input id="grid-width" type="range" min="10" max="40" step="1" value={gridWidth} onChange={(e) => setGridWidth(parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"/>
                    </div>
                     <div className="space-y-2">
                        <label htmlFor="grid-height" className="block text-sm font-medium text-gray-400">Grid Height: {gridHeight}</label>
                        <input id="grid-height" type="range" min="10" max="30" step="1" value={gridHeight} onChange={(e) => setGridHeight(parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                    </div>
                    <div className="md:col-span-2 text-center">
                        <p className="text-sm text-gray-400 mb-2">Click and drag on the video to select a Region of Interest (ROI) for analysis.</p>
                        <button onClick={() => setRoi(null)} disabled={!roi} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">Clear ROI</button>
                    </div>
                </div>
            </details>
            
             <div className="mt-6 flex flex-col items-center">
                <div className={`text-center font-semibold p-3 rounded-lg ${isClipValid ? 'bg-green-800/60 text-green-300' : 'bg-yellow-800/60 text-yellow-300'}`}>
                    <IconScissors />
                    Clip Duration: {clipDuration.toFixed(2)}s
                    <span className="ml-2 text-sm"> (Max: {MAX_CLIP_DURATION_S}.00s)</span>
                </div>
                <button
                    onClick={handleCalculateClick}
                    disabled={!isClipValid || isCalculating}
                    className="mt-4 w-full md:w-auto flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all transform hover:scale-105"
                >
                    <IconCalculate />
                    {isCalculating ? 'Calculating...' : 'Calculate Flow Field'}
                </button>
            </div>
        </div>
    );
};
