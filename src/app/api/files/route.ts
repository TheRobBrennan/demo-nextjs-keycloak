import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { readdir, readFile, stat } from 'fs/promises';
import path from 'path';
import { isSystemAdmin } from '@/utils/auth';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!isSystemAdmin(session)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const entries = await readdir(uploadsDir);

        // Filter out non-directory entries and hidden files
        const users = await Promise.all(
            entries.map(async (entry) => {
                const entryPath = path.join(uploadsDir, entry);
                const stats = await stat(entryPath);
                return { entry, isDirectory: stats.isDirectory() };
            })
        ).then(results =>
            results
                .filter(({ isDirectory }) => isDirectory)
                .map(({ entry }) => entry)
        );

        const usersFiles = await Promise.all(
            users.map(async (username) => {
                const userDir = path.join(uploadsDir, username);
                const files = await readdir(userDir);

                const metaFiles = files.filter(f => f.endsWith('.meta.json'));
                const filesMetadata = await Promise.all(
                    metaFiles.map(async (metaFile) => {
                        const content = await readFile(
                            path.join(userDir, metaFile),
                            'utf-8'
                        );
                        return JSON.parse(content);
                    })
                );

                return {
                    username,
                    files: filesMetadata
                };
            })
        );

        return NextResponse.json(usersFiles);
    } catch (error) {
        console.error('Error listing files:', error);
        return NextResponse.json(
            { error: 'Error listing files' },
            { status: 500 }
        );
    }
} 