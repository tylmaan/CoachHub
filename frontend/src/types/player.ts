export interface Player {
    id: number;
    firstName: string;
    lastName: string;
    nationality: string | null;
    dateOfBirth: string; 
    position: string;
    teamId: number;
    heightCm: number | null;
    jerseyNumber: number | null;
    preferredFoot: string | null;
    photoUrl: string | null;
}