'use client';

import { useAdminCheck } from '@/hooks/useAdminCheck';

export default function AdminPanel() {
    const isAdmin = useAdminCheck();

    if (!isAdmin) return null;

    return (
        <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Admin Controls</h2>
            {/* Add admin-only controls here */}
        </div>
    );
} 