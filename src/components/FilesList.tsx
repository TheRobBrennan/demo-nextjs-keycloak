'use client';

import { useEffect, useState } from 'react';

interface FileMetadata {
    filename: string;
    uploadDate: string;
    description: string;
    size: number;
    type: string;
}

interface UserFiles {
    username: string;
    files: FileMetadata[];
}

export default function FilesList() {
    const [users, setUsers] = useState<UserFiles[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchFiles() {
            try {
                const response = await fetch('/api/files');
                if (!response.ok) throw new Error('Failed to fetch files');
                const data = await response.json();
                setUsers(data);
            } catch (err) {
                setError('Error loading files');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchFiles();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    if (users.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No files have been uploaded yet.</p>
                <p className="text-sm text-gray-500 mt-2">
                    Files uploaded by researchers will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl p-4 space-y-6">
            {users.map((user) => (
                <div key={user.username} className="border rounded-lg p-4">
                    <h2 className="text-xl font-bold mb-4">{user.username}</h2>
                    <div className="grid gap-4">
                        {user.files.map((file) => (
                            <div key={`${user.username}-${file.filename}`} className="bg-gray-50 p-3 rounded">
                                <div className="font-medium">{file.filename}</div>
                                <div className="text-sm text-gray-600">
                                    <div>Uploaded: {new Date(file.uploadDate).toLocaleString()}</div>
                                    <div>Size: {(file.size / 1024).toFixed(2)} KB</div>
                                    <div>Type: {file.type}</div>
                                    <div>Description: {file.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
} 