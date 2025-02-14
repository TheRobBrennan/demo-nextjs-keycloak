import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import FilesList from '@/components/FilesList';
import AdminGuard from '@/components/AdminGuard';

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions);

    return (
        <AdminGuard>
            <div className='flex flex-col space-y-6 p-8'>
                <div className='text-center'>
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <div>Welcome, {session?.user?.name}</div>
                </div>

                <div className="w-full max-w-6xl mx-auto">
                    <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
                    <FilesList />
                </div>
            </div>
        </AdminGuard>
    );
} 