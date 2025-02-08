import AdminGuard from '@/components/AdminGuard';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <AdminGuard>
            {children}
        </AdminGuard>
    );
} 