import React, { useState } from 'react';
import type { Vector, OpenFoamFileSet } from '../types';
import { VectorFieldDisplay } from './VectorFieldDisplay';

type ROI = { x: number; y: number; width: number; height: number; };

interface ResultsDisplayProps {
    vectorField: Vector[][];
    openFoamFiles: OpenFoamFileSet;
    previewFrame: string;
    vectorDensity: number;
    setVectorDensity: (value: number) => void;
    arrowScale: number;
    setArrowScale: (value: number) => void;
    roi: ROI | null;
    gridWidth: number;
}

type Tab = keyof OpenFoamFileSet | 'Visualization';
type DisplayMode = 'Vectors' | 'Streamlines' | 'Heatmap';

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
    vectorField, 
    openFoamFiles, 
    previewFrame,
    vectorDensity,
    setVectorDensity,
    arrowScale,
    setArrowScale,
    roi,
    gridWidth
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('Visualization');
    const [copiedFile, setCopiedFile] = useState<string | null>(null);
    const [displayMode, setDisplayMode] = useState<DisplayMode>('Vectors');

    const tabs: { id: Tab; label: string }[] = [
        { id: 'Visualization', label: 'Flow Visualization' },
        { id: 'U', label: 'U (Velocity)' },
        { id: 'controlDict', label: 'controlDict' },
        { id: 'fvSchemes', label: 'fvSchemes' },
        { id: 'fvSolution', label: 'fvSolution' },
        { id: 'transportProperties', label: 'transportProperties' },
    ];
    
    const copyToClipboard = (text: string, fileName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedFile(fileName);
        setTimeout(() => setCopiedFile(null), 2000);
    };

    const renderContent = () => {
        if (activeTab === 'Visualization') {
            return (
                <div>
                    <div className="bg-gray-900/70 p-4 rounded-t-lg flex flex-col md:flex-row gap-4 md:items-center border-b border-gray-700">
                        {/* Display Mode Toggle */}
                        <div className="flex-shrink-0">
                            <span className="block text-sm font-medium text-gray-300 mb-2 md:mb-1">Display Mode</span>
                            <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-1 space-x-1">
                                {(['Vectors', 'Streamlines', 'Heatmap'] as DisplayMode[]).map(mode => (
                                    <button 
                                        key={mode}
                                        onClick={() => setDisplayMode(mode)}
                                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors w-full md:w-auto ${
                                            displayMode === mode ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'
                                        }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                         {/* Sliders */}
                        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            {displayMode !== 'Heatmap' && (
                                <div className="min-w-[120px]">
                                    <label htmlFor="density-slider" className="block text-sm font-medium text-gray-300 mb-1">
                                        {displayMode === 'Vectors' ? 'Vector Density' : 'Streamline Density'} ({vectorDensity})
                                    </label>
                                    <input
                                        id="density-slider"
                                        type="range"
                                        min="4"
                                        max={gridWidth}
                                        value={vectorDensity}
                                        onChange={(e) => setVectorDensity(parseInt(e.target.value, 10))}
                                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                        aria-label="Density"
                                    />
                                </div>
                            )}
                            {displayMode === 'Vectors' && (
                                <div className="min-w-[120px]">
                                    <label htmlFor="scale-slider" className="block text-sm font-medium text-gray-300 mb-1">
                                        Arrow Scale ({arrowScale.toFixed(1)}x)
                                    </label>
                                    <input
                                        id="scale-slider"
                                        type="range"
                                        min="0.2"
                                        max="3"
                                        step="0.1"
                                        value={arrowScale}
                                        onChange={(e) => setArrowScale(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        aria-label="Arrow Scale"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <VectorFieldDisplay 
                        vectorField={vectorField} 
                        backgroundImage={previewFrame}
                        density={vectorDensity}
                        scale={arrowScale}
                        displayMode={displayMode.toLowerCase() as 'vectors' | 'streamlines' | 'heatmap'}
                        roi={roi}
                     />
                </div>
            );
        }
        
        const fileContent = openFoamFiles[activeTab as keyof OpenFoamFileSet];
        const fileName = activeTab;

        return (
            <div className="relative">
                <button
                    onClick={() => copyToClipboard(fileContent, fileName)}
                    className="absolute top-2 right-2 px-3 py-1 bg-gray-600 hover:bg-cyan-700 text-sm rounded-md transition-colors"
                >
                    {copiedFile === fileName ? 'Copied!' : 'Copy'}
                </button>
                <pre className="bg-gray-900 text-gray-300 p-4 rounded-b-lg overflow-auto h-[500px] text-xs">
                    <code>{fileContent}</code>
                </pre>
            </div>
        );
    };

    return (
        <div className="bg-gray-800/50 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
             <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-6">
                Analysis Results
            </h2>
            <div className="flex border-b border-gray-600 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                            activeTab === tab.id
                                ? 'border-b-2 border-cyan-400 text-cyan-300'
                                : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="mt-4">
                {renderContent()}
            </div>
        </div>
    );
};