/*
|--------------------------------------------------------------------------
| Realtime Event Contracts
|--------------------------------------------------------------------------
|
| Wire format for events fanned out from Redis (published by the Laravel
| outbox) to Socket.IO rooms. Envelope shape mirrors the outbox row.
|
*/

export interface OutboxEnvelope<P> {
    event_id: string;
    event_type: string;
    aggregate_type: string;
    aggregate_id: number;
    payload: P;
    occurred_at: string;
}

export interface ScoreEventPayload {
    match_id: number;
    innings_id: number;
    ball_id: number;
    event_type: "score.updated" | "ball.undone";
    version: number;
    event: Record<string, unknown>;
}

export interface AuctionEventPayload {
    tournament_id: number;
    action: "bid" | "player_sold" | "current_player_set" | "player_unsold";
    auction_id?: number;
    player_id?: number;
    team_id?: number;
    bid_amount?: number;
    price?: number;
    base_price?: number;
    status?: string;
}

export type ScoreUpdatedEvent = OutboxEnvelope<ScoreEventPayload>;

export type AuctionUpdatedEvent = OutboxEnvelope<AuctionEventPayload>;
