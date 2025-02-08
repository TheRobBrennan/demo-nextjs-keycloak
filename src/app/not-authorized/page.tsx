import Link from 'next/link';

export default function NotAuthorized() {
    return (
        <div className='flex flex-col space-y-3 justify-center items-center h-screen'>
            <h1 className="text-2xl font-bold text-red-500">Not Authorized</h1>
            <p>You do not have permission to access this page.</p>
            <Link
                href="/"
                className="text-blue-500 hover:text-blue-700 underline"
            >
                Return to Home
            </Link>
        </div>
    );
} 