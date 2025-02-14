import { useState, useEffect } from 'react';

interface FileStatus {
    name: string;
    timestamp: string;
    status: 'uploading' | 'complete' | 'error';
    progress?: number;
}

interface FileUploadStatusProps {
    files: FileStatus[];
}

export default function FileUploadStatus({ files }: FileUploadStatusProps) {
    return (
        <div className="w-full max-w-2xl mx-auto mt-8">
            <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
            <div className="space-y-4">
                {files.map((file, index) => (
                    <div
                        key={`${file.name}-${index}`}
                        className="border rounded-lg p-4 shadow-sm"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">{file.name}</p>
                                <p className="text-sm text-gray-500">
                                    {new Date(file.timestamp).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex items-center">
                                {file.status === 'uploading' && (
                                    <div className="w-32">
                                        <div className="bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 rounded-full h-2 transition-all duration-300"
                                                style={{ width: `${file.progress}%` }}
                                            />
                                        </div>
                                        <p className="text-sm text-center mt-1">{file.progress}%</p>
                                    </div>
                                )}
                                {file.status === 'complete' && (
                                    <span className="text-green-500">✓ Complete</span>
                                )}
                                {file.status === 'error' && (
                                    <span className="text-red-500">✗ Error</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 