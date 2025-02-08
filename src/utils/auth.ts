import { Session } from "next-auth";

export function isSystemAdmin(session: Session | null): boolean {
    return session?.roles?.includes('system-admin') ?? false;
}

export function isResearcher(session: Session | null): boolean {
    return session?.roles?.includes('researcher') ?? false;
} 