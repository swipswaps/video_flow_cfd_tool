
import React, { useState, useCallback, useMemo } from 'react';
import { VideoLoader } from './components/VideoLoader';
import { VideoTrimmer } from './components/VideoTrimmer';
import { ResultsDisplay } from './components/ResultsDisplay';
import { calculateFlowAndGenerateFiles } from './services/cfdCalculator';
import type { Vector, OpenFoamFileSet } from './types';
import { MAX_CLIP_DURATION_S, GRID_WIDTH } from './constants';

// Define assets as SVG components
const IconCFD = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 12.5s-1.5 1.5-3 0-3 0-3 0M19 8.5s-1.5 1.5-3 0-3 0-3 0M13 16.5s-1.5 1.5-3 0-3 0-3 0" />
    </svg>
);

const App: React.FC = () => {
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [results, setResults] = useState<{ vectorField: Vector[][]; openFoamFiles: OpenFoamFileSet; previewFrame: string; } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // State for visualization controls
    const [vectorDensity, setVectorDensity] = useState<number>(GRID_WIDTH / 2);
    const [arrowScale, setArrowScale] = useState<number>(1.0);

    const handleVideoLoad = (src: string) => {
        setVideoSrc(src);
        setResults(null);
        setError(null);
    };

    const handleCalculation = useCallback(async (videoElement: HTMLVideoElement, startTime: number, endTime: number) => {
        if (!videoElement || (endTime - startTime) <= 0 || (endTime - startTime) > MAX_CLIP_DURATION_S) {
            setError(`Clip duration must be between 0 and ${MAX_CLIP_DURATION_S} seconds.`);
            return;
        }

        setIsLoading(true);
        setError(null);
        setResults(null);

        try {
            const calculatedResults = await calculateFlowAndGenerateFiles(
                videoElement,
                startTime,
                endTime,
                (message: string) => setStatusMessage(message)
            );
            setResults(calculatedResults);
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'An unknown error occurred during calculation.');
        } finally {
            setIsLoading(false);
            setStatusMessage('');
        }
    }, []);

    const StatusIndicator: React.FC = useMemo(() => () => {
        if (!isLoading && !error && !results) return null;

        return (
            <div className="mt-8">
                {isLoading && (
                    <div className="flex items-center justify-center p-4 bg-gray-800 rounded-lg">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-lg text-cyan-300 font-medium">{statusMessage || 'Initializing...'}</span>
                    </div>
                )}
                {error && (
                    <div className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}
                {!isLoading && !error && results && (
                     <div className="p-4 bg-green-900/50 border border-green-700 text-green-300 rounded-lg" role="alert">
                        <p className="font-bold">Calculation Successful</p>
                        <p>Fluid dynamics analysis complete. Results are displayed below.</p>
                    </div>
                )}
            </div>
        );
    }, [isLoading, error, results, statusMessage]);


    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
            <main className="container mx-auto px-4 py-8">
                <header className="text-center mb-10 border-b border-gray-700 pb-6">
                    <div className="flex items-center justify-center gap-4">
                        <IconCFD />
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            CFD Flow Visualizer
                        </h1>
                    </div>
                    <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
                        Analyze fluid motion from video clips and generate OpenFOAM-compatible files using AI-powered flow estimation.
                    </p>
                </header>

                <div className="bg-gray-800/50 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
                    <VideoLoader onVideoLoad={handleVideoLoad} />
                    
                    {videoSrc && (
                        <div className="mt-8">
                            <VideoTrimmer
                                src={videoSrc}
                                onCalculate={handleCalculation}
                                isCalculating={isLoading}
                            />
                        </div>
                    )}
                </div>
                
                <StatusIndicator />

                {results && (
                    <div className="mt-12">
                        <ResultsDisplay
                            vectorField={results.vectorField}
                            openFoamFiles={results.openFoamFiles}
                            previewFrame={results.previewFrame}
                            vectorDensity={vectorDensity}
                            setVectorDensity={setVectorDensity}
                            arrowScale={arrowScale}
                            setArrowScale={setArrowScale}
                        />
                    </div>
                )}
            </main>
            <footer className="text-center py-6 text-gray-500 text-sm mt-8 border-t border-gray-800">
                <p>Powered by React, Tailwind CSS, and Gemini API.</p>
            </footer>
        </div>
    );
};

export default App;
