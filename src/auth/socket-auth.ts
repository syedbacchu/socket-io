/*
|--------------------------------------------------------------------------
| Socket Authentication
|--------------------------------------------------------------------------
|
| Optional handshake authentication using Laravel Passport access tokens
| (RS256 JWTs). Connections without a token are treated as anonymous so
| public rooms keep working; a token that is present but invalid is
| rejected (fail closed).
|
*/

import type { Socket } from "socket.io";
import jwt from "jsonwebtoken";

import { env } from "../config/env";

export interface AuthenticatedUser {
    id: number;
}

declare module "socket.io" {
    interface SocketData {
        user?: AuthenticatedUser;
    }
}

export function verifySocketToken(token: string): AuthenticatedUser | null {
    if (!env.jwtPublicKey) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, env.jwtPublicKey, {
            algorithms: ["RS256"],
        });

        if (typeof decoded === "string" || !decoded.sub) {
            return null;
        }

        const userId = Number(decoded.sub);

        if (!Number.isInteger(userId) || userId <= 0) {
            return null;
        }

        return { id: userId };

    } catch {
        return null;
    }
}

function extractToken(socket: Socket): string | undefined {
    const authToken = socket.handshake.auth?.token;

    if (typeof authToken === "string" && authToken.length > 0) {
        return authToken;
    }

    const header = socket.handshake.headers.authorization;

    if (typeof header === "string" && header.startsWith("Bearer ")) {
        return header.slice("Bearer ".length);
    }

    return undefined;
}

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): void {
    const token = extractToken(socket);

    if (!token) {
        next();

        return;
    }

    const user = verifySocketToken(token);

    if (!user) {
        next(new Error("invalid_token"));

        return;
    }

    socket.data.user = user;

    next();
}
