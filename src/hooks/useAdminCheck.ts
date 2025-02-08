import { useSession } from 'next-auth/react';
import { isSystemAdmin } from '@/utils/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAdminCheck() {
    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (!isSystemAdmin(session)) {
            router.push('/');
        }
    }, [session, router]);

    return isSystemAdmin(session);
} 