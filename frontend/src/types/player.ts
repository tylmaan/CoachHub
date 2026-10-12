export interface Player {
    id: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string; 
    position: string;
    teamId: number;
    heightCm: number | null;
    jerseyNumber: number | null;
    preferredFoot: string | null;
    photoUrl: string | null;
}