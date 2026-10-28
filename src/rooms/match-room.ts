export function publicMatchRoom(matchId: number | string): string {
    return `match:${matchId}:public`;
}

export function publicAuctionRoom(tournamentId: number | string): string {
    return `tournament:${tournamentId}:auction:public`;
}

export function userNotificationRoom(userId: number | string): string {
    return `user:${userId}:notifications`;
}