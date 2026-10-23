import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTeams } from '../api/teamsApi';
import type { TeamSummary } from '../types/team';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import SportsSoccerOutlinedIcon from '@mui/icons-material/SportsSoccerOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import { DashboardPageView } from './DashboardPageView';
import type { Tile } from './DashboardPageView';

export function DashboardPage() {
    const { roles } = useAuth();
    const isAdmin = roles?.includes('Admin');
    const [team, setTeam] = useState<TeamSummary | null>(null);

    useEffect(() => {
        if (isAdmin) return;
        getTeams()
            .then((teams) => setTeam(teams[0] ?? null))
            .catch(() => {});
    }, [isAdmin]);

    const tiles: Tile[] = isAdmin 
        ?[
            { label: 'Drużyny', path: '/teams', icon: <ShieldOutlinedIcon sx={{ fontSize: 32 }} /> },
            { label: 'Użytkownicy', path: '/users', icon: <ManageAccountsOutlinedIcon sx={{ fontSize: 32 }} /> }
        ]
        : [
            { label: 'Zawodnicy', path: '/players', icon: <GroupsOutlinedIcon sx={{ fontSize: 32 }} /> },
            { label: 'Mecze', path: '/matches', icon: <SportsSoccerOutlinedIcon sx={{ fontSize: 32 }} /> },
            { label: 'Statystyki', path: '/player-stats', icon: <BarChartOutlinedIcon sx={{ fontSize: 32 }} /> }
        ];

    return <DashboardPageView tiles={tiles} team={team} />;
} 