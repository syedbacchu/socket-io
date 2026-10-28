/*
|--------------------------------------------------------------------------
| Environment Configuration
|--------------------------------------------------------------------------
|
| Typed access to environment variables with sane defaults.
| Fail-loud only where the server cannot operate without the value.
|
*/

function optional(name: string, value: string | undefined): string | undefined {
    return value && value.length > 0 ? value : undefined;
}

const jwtPublicKeyRaw = optional("JWT_PUBLIC_KEY", process.env.JWT_PUBLIC_KEY);

export const env = {
    port: Number(process.env.PORT || 3001),

    redis: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT || 6379),
        password: optional("REDIS_PASSWORD", process.env.REDIS_PASSWORD),
    },

    /*
    | Passport access tokens are RS256 JWTs signed with the
    | Laravel oauth-private key. This is the matching public key.
    */
    jwtPublicKey: jwtPublicKeyRaw
        ? jwtPublicKeyRaw.replace(/\\n/g, "\n")
        : undefined,

    corsOrigins: (
        process.env.CORS_ORIGINS ||
        "https://admin.setmyscore.com,https://setmyscore.com,http://localhost:3000,http://localhost:8000"
    ).split(","),
};

if (!env.jwtPublicKey) {
    console.warn(
        "JWT_PUBLIC_KEY is not set — socket auth is disabled and all connections are treated as anonymous.",
    );
}
