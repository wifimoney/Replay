// src/lib/auth.ts
import { PrivyClient } from "@privy-io/server-auth";

const privy = new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID || "",
    process.env.PRIVY_APP_SECRET || ""
);

export type PrivyVerifiedClaims = {
    userId: string;     // Privy DID
    appId: string;
    issuer: string;
    sessionId: string;
    issuedAt: number;
    expiration: number;
};

function getBearerToken(req: Request): string | null {
    const header = req.headers.get("authorization");
    if (!header) return null;
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match?.[1] ?? null;
}

export async function verifyPrivyAccessToken(req: Request): Promise<PrivyVerifiedClaims | null> {
    const token = getBearerToken(req);
    if (!token) return null;

    try {
        // Privy docs: verifyAccessToken via utils().auth()
        const claims = await (privy as any).verifyAuthToken(token);
        return claims as PrivyVerifiedClaims;
    } catch {
        return null;
    }
}

export async function requirePrivyUser(req: Request): Promise<PrivyVerifiedClaims> {
    const claims = await verifyPrivyAccessToken(req);
    if (!claims) {
        throw new Error("UNAUTHORIZED");
    }
    return claims;
}
