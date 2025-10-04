
import React, { useState } from 'react';
import type { Vector, OpenFoamFileSet } from '../types';
import { VectorFieldDisplay } from './VectorFieldDisplay';
import { GRID_WIDTH } from '../constants';

interface ResultsDisplayProps {
    vectorField: Vector[][];
    openFoamFiles: OpenFoamFileSet;
    previewFrame: string;
    vectorDensity: number;
    setVectorDensity: (value: number) => void;
    arrowScale: number;
    setArrowScale: (value: number) => void;
}

type Tab = keyof OpenFoamFileSet | 'Visualization';

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
    vectorField, 
    openFoamFiles, 
    previewFrame,
    vectorDensity,
    setVectorDensity,
    arrowScale,
    setArrowScale
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('Visualization');
    const [copiedFile, setCopiedFile] = useState<string | null>(null);

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
                    <div className="bg-gray-900/70 p-4 rounded-t-lg flex flex-col sm:flex-row gap-4 sm:items-center border-b border-gray-700">
                        <div className="flex-1">
                            <label htmlFor="density-slider" className="block text-sm font-medium text-gray-300 mb-1">
                                Vector Density ({vectorDensity})
                            </label>
                            <input
                                id="density-slider"
                                type="range"
                                min="4"
                                max={GRID_WIDTH}
                                value={vectorDensity}
                                onChange={(e) => setVectorDensity(parseInt(e.target.value, 10))}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                aria-label="Vector Density"
                            />
                        </div>
                        <div className="flex-1">
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
                    </div>
                    <VectorFieldDisplay 
                        vectorField={vectorField} 
                        backgroundImage={previewFrame}
                        density={vectorDensity}
                        scale={arrowScale}
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
