export interface MatchEvent {
    id: number;
    eventType: string;
    team: string;
    minute: number | null;
    matchId: number;
    playerId: number | null;
    opponentPlayerName: string | null;
}