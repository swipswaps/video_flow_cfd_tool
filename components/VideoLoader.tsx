
import React, { useState, useRef } from 'react';

interface VideoLoaderProps {
    onVideoLoad: (src: string) => void;
}

const IconUpload = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const IconLink = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);


export const VideoLoader: React.FC<VideoLoaderProps> = ({ onVideoLoad }) => {
    const [url, setUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            onVideoLoad(url);
        }
    };

    const handleUrlSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (url) {
            // NOTE: Using a CORS proxy for remote URLs might be necessary in a real-world scenario
            // For this implementation, we assume the URL is CORS-friendly.
            onVideoLoad(url);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center text-cyan-300 border-b border-gray-700 pb-3">1. Load Your Video</h2>
            <div className="grid md:grid-cols-2 gap-6 items-start">
                {/* File Upload */}
                <div className="flex flex-col items-center p-6 bg-gray-700/50 rounded-lg border border-dashed border-gray-600 hover:border-cyan-400 transition-colors">
                     <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileInputRef}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-transform transform hover:scale-105"
                    >
                        <IconUpload />
                        Upload from Device
                    </button>
                    <p className="mt-3 text-sm text-gray-400">Select a local video file.</p>
                </div>
                
                {/* URL Input */}
                <div className="flex flex-col items-center p-6 bg-gray-700/50 rounded-lg border border-gray-600">
                    <form onSubmit={handleUrlSubmit} className="w-full flex flex-col items-center">
                        <div className="w-full flex">
                             <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Or paste video URL..."
                                className="flex-grow bg-gray-900 border border-gray-600 rounded-l-md px-4 py-3 text-gray-200 focus:ring-cyan-500 focus:border-cyan-500"
                            />
                            <button
                                type="submit"
                                className="inline-flex items-center px-4 py-3 border border-transparent text-base font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
                            >
                               <IconLink/>
                            </button>
                        </div>
                    </form>
                     <p className="mt-3 text-sm text-gray-400">CORS policy may affect remote URLs.</p>
                </div>
            </div>
        </div>
    );
};
