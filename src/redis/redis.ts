import Redis from "ioredis";

const redisOptions = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
};

export const redisPublisher = new Redis(redisOptions);

export const redisSubscriber = new Redis(redisOptions);

redisPublisher.on("connect", () => {
    console.log("Redis publisher connected");
});

redisSubscriber.on("connect", () => {
    console.log("Redis subscriber connected");
});

redisPublisher.on("error", (error) => {
    console.error("Redis publisher error:", error);
});

redisSubscriber.on("error", (error) => {
    console.error("Redis subscriber error:", error);
});