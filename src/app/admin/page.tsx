import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import FilesList from '@/components/FilesList';
import AdminGuard from '@/components/AdminGuard';
import Link from 'next/link';

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions);

    return (
        <AdminGuard>
            <div className='min-h-screen bg-white'>
                <div className='flex flex-col space-y-6 p-8'>
                    <div className='text-center'>
                        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                        <div>Welcome, {session?.user?.name}</div>
                    </div>

                    <div className="w-full max-w-6xl mx-auto">
                        <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
                        <FilesList />
                        <div className="mt-8 text-center">
                            <Link
                                href="/"
                                className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                                Return Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AdminGuard>
    );
} 