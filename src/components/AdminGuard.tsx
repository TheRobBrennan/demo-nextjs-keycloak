import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { isSystemAdmin } from '@/utils/auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

interface AdminGuardProps {
    children: ReactNode;
}

export default async function AdminGuard({ children }: AdminGuardProps) {
    const session = await getServerSession(authOptions);

    if (!isSystemAdmin(session)) {
        redirect('/');
    }

    return <>{children}</>;
} 