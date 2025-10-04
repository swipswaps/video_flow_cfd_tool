
import React, { useState } from 'react';
import type { Vector, OpenFoamFileSet } from '../types';
import { VectorFieldDisplay } from './VectorFieldDisplay';

interface ResultsDisplayProps {
    vectorField: Vector[][];
    openFoamFiles: OpenFoamFileSet;
    previewFrame: string;
}

type Tab = keyof OpenFoamFileSet | 'Visualization';

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ vectorField, openFoamFiles, previewFrame }) => {
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
            return <VectorFieldDisplay vectorField={vectorField} backgroundImage={previewFrame} />;
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
