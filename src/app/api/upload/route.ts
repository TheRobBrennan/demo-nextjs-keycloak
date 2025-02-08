import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.name) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const files = formData.getAll('files') as File[];
        const description = formData.get('description') as string;

        // Create user directory if it doesn't exist
        const userDir = path.join(process.cwd(), 'uploads', session.user.name);
        await mkdir(userDir, { recursive: true });

        // Process each file
        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const filePath = path.join(userDir, file.name);

            // Save file
            await writeFile(filePath, buffer);

            // Save metadata
            const metadata = {
                filename: file.name,
                uploadDate: new Date().toISOString(),
                description,
                size: file.size,
                type: file.type
            };

            await writeFile(
                `${filePath}.meta.json`,
                JSON.stringify(metadata, null, 2)
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Error uploading files' },
            { status: 500 }
        );
    }
} 