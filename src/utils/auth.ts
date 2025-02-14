import { Session } from "next-auth";

export const isSystemAdmin = (session: Session | null): boolean => {
    return session?.roles?.includes('system-admin') ?? false;
};

export const isResearcher = (session: Session | null): boolean => {
    return session?.roles?.includes('researcher') ?? false;
}; 