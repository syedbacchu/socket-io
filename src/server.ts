import "dotenv/config";

import { createServer } from "node:http";
import { Server } from "socket.io";

import { env } from "./config/env";
import { socketAuthMiddleware } from "./auth/socket-auth";
import { redisSubscriber } from "./redis/redis";
import {
    publicMatchRoom,
    publicAuctionRoom,
    userNotificationRoom,
} from "./rooms/match-room";

const httpServer = createServer();

const io = new Server(httpServer, {
    cors: {
        origin: env.corsOrigins,
        credentials: true,
    },

    transports: ["websocket", "polling"],
});

io.use(socketAuthMiddleware);


/*
|--------------------------------------------------------------------------
| Redis Events
|--------------------------------------------------------------------------
*/

redisSubscriber.on("message", (channel, message) => {
    try {
        const envelope = JSON.parse(message);

        switch (channel) {
            case "score.updated": {
                const matchId = envelope?.payload?.match_id ?? envelope?.aggregate_id;
                const room = publicMatchRoom(matchId);

                io.to(room).emit("score.updated", envelope);

                console.log(`Score update → ${room}`);

                break;
            }

            case "auction.updated": {
                const tournamentId = envelope?.payload?.tournament_id ?? envelope?.aggregate_id;
                const room = publicAuctionRoom(tournamentId);

                io.to(room).emit("auction.updated", envelope);

                console.log(`Auction update → ${room}`);

                break;
            }

            case "match.notification": {
                const userIds: number[] = envelope?.user_ids ?? [];

                for (const userId of userIds) {
                    const room = userNotificationRoom(userId);

                    io.to(room).emit(
                        "match.notification",
                        envelope,
                    );
                }

                console.log(
                    `Private notification → ${userIds.length} users`,
                );

                break;
            }

            default:
                console.warn(
                    `Unknown Redis channel: ${channel}`,
                );
        }
    } catch (error) {
        console.error(
            "Invalid Redis message:",
            error,
        );
    }
});


/*
|--------------------------------------------------------------------------
| Socket Connection
|--------------------------------------------------------------------------
*/

io.on("connection", (socket) => {
    const authLabel = socket.data.user
        ? `user:${socket.data.user.id}`
        : "anonymous";

    console.log(`Socket connected: ${socket.id} (${authLabel})`);


    /*
    |--------------------------------------------------------------------------
    | Join Public Match
    |--------------------------------------------------------------------------
    */

    socket.on("join_match", (data) => {
        const matchId = data?.match_id;

        if (!matchId) {
            socket.emit("socket.error", {
                message: "match_id is required.",
            });

            return;
        }

        const room = publicMatchRoom(matchId);

        socket.join(room);

        socket.emit("match.joined", {
            match_id: matchId,
            room,
        });

        console.log(
            `${socket.id} joined ${room}`,
        );
    });


    /*
    |--------------------------------------------------------------------------
    | Leave Public Match
    |--------------------------------------------------------------------------
    */

    socket.on("leave_match", (data) => {
        const matchId = data?.match_id;

        if (!matchId) {
            return;
        }

        const room = publicMatchRoom(matchId);

        socket.leave(room);

        console.log(
            `${socket.id} left ${room}`,
        );
    });


    /*
    |--------------------------------------------------------------------------
    | Join Public Auction
    |--------------------------------------------------------------------------
    */

    socket.on("join_auction", (data) => {
        const tournamentId = data?.tournament_id;

        if (!tournamentId) {
            socket.emit("socket.error", {
                message: "tournament_id is required.",
            });

            return;
        }

        const room = publicAuctionRoom(tournamentId);

        socket.join(room);

        socket.emit("auction.joined", {
            tournament_id: tournamentId,
            room,
        });

        console.log(
            `${socket.id} joined ${room}`,
        );
    });


    /*
    |--------------------------------------------------------------------------
    | Leave Public Auction
    |--------------------------------------------------------------------------
    */

    socket.on("leave_auction", (data) => {
        const tournamentId = data?.tournament_id;

        if (!tournamentId) {
            return;
        }

        const room = publicAuctionRoom(tournamentId);

        socket.leave(room);

        console.log(
            `${socket.id} left ${room}`,
        );
    });


    /*
    |--------------------------------------------------------------------------
    | Join Private Notifications
    |--------------------------------------------------------------------------
    |
    | Authenticated connections (Passport token at handshake) are pinned
    | to their own user room; the payload user_id is ignored so it cannot
    | be spoofed. Anonymous connections keep the legacy user_id behaviour
    | for the existing notification flow.
    |
    */

    socket.on("join_notifications", (data) => {
        const authenticatedUser = socket.data.user;
        const userId = authenticatedUser ? authenticatedUser.id : data?.user_id;

        if (!userId) {
            socket.emit("socket.error", {
                message: "user_id is required.",
            });

            return;
        }

        const room = userNotificationRoom(userId);

        socket.join(room);

        socket.emit("notifications.joined", {
            room,
        });

        console.log(
            `${socket.id} joined ${room}`,
        );
    });


    /*
    |--------------------------------------------------------------------------
    | Disconnect
    |--------------------------------------------------------------------------
    */

    socket.on("disconnect", (reason) => {
        console.log(
            `Socket disconnected: ${socket.id}`,
            reason,
        );
    });
});


/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

async function startServer() {
    try {
        await redisSubscriber.subscribe(
            "score.updated",
            "auction.updated",
            "match.notification",
        );

        console.log(
            "Redis subscribed to realtime channels",
        );

        httpServer.listen(env.port, () => {
            console.log(
                `Socket.IO server running on port ${env.port}`,
            );
        });

    } catch (error) {
        console.error(
            "Failed to start Socket.IO server:",
            error,
        );

        process.exit(1);
    }
}

startServer();
