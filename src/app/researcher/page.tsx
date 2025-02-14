import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import FileUpload from '@/components/FileUpload';
import FileUploadStatus from '@/components/FileUploadStatus';
import { isResearcher } from '@/utils/auth';
import { redirect } from 'next/navigation';

export default async function ResearcherDashboard() {
    const session = await getServerSession(authOptions);

    if (!session || !isResearcher(session)) {
        redirect('/');
    }

    return (
        <div className='flex flex-col space-y-6 p-8'>
            <div className='text-center'>
                <h1 className="text-2xl font-bold">Research File Upload</h1>
                <div>Welcome, {session?.user?.name}</div>
            </div>

            <div className="w-full max-w-2xl mx-auto">
                <FileUpload />
            </div>
        </div>
    );
} 