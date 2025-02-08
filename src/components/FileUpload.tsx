'use client';

import { useState } from 'react';

export default function FileUpload() {
    const [files, setFiles] = useState<FileList | null>(null);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!files || files.length === 0) return;

        setUploading(true);
        setMessage('');

        try {
            const formData = new FormData();
            Array.from(files).forEach((file) => {
                formData.append('files', file);
            });
            formData.append('description', description);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            setFiles(null);
            setDescription('');
            setMessage('Files uploaded successfully!');
        } catch (error) {
            console.error(error);
            setMessage('Error uploading files');
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-lg p-4 space-y-4">
            <div>
                <label className="block text-sm font-medium mb-2">Files:</label>
                <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(e.target.files)}
                    className="w-full p-2 border rounded"
                    disabled={uploading}
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">Description:</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={3}
                    disabled={uploading}
                />
            </div>

            {message && (
                <div className={`p-2 rounded ${message.includes('Error') ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                    {message}
                </div>
            )}

            <button
                type="submit"
                disabled={!files || uploading}
                className="bg-sky-500 hover:bg-sky-700 px-5 py-2 text-sm leading-5 rounded-full font-semibold text-white disabled:opacity-50"
            >
                {uploading ? 'Uploading...' : 'Upload Files'}
            </button>
        </form>
    );
} 