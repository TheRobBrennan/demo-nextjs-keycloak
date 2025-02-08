import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import FileUpload from '@/components/FileUpload';
import { redirect } from 'next/navigation';

export default async function ResearcherPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.name) {
        redirect('/');
    }

    return (
        <div className='flex flex-col space-y-3 justify-center items-center h-screen'>
            <h1 className="text-2xl font-bold mb-4">Upload Research Files</h1>
            <FileUpload />
        </div>
    );
} 