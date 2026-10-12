import { useAuth } from '../context/AuthContext';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import SportsSoccerOutlinedIcon from '@mui/icons-material/SportsSoccerOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import { DashboardPageView } from './DashboardPageView';
import type { Tile } from './DashboardPageView';

export function DashboardPage() {
    const { roles } = useAuth();
    const isAdmin = roles?.includes('Admin');

    const tiles: Tile[] = [
        { label: 'Drużyny', path: '/teams', icon: <ShieldOutlinedIcon sx={{ fontSize: 32 }} /> },
        ...(isAdmin ? [{ label: 'Użytkownicy', path: '/users', icon: <ManageAccountsOutlinedIcon sx={{ fontSize: 32 }} /> }] 
            : [
                { label: 'Zawodnicy', path: '/players', icon: <GroupsOutlinedIcon sx={{ fontSize: 32 }} /> },
                { label: 'Mecze', path: '/matches', icon: <SportsSoccerOutlinedIcon sx={{ fontSize: 32 }} /> },
            ]),
    ];

    return <DashboardPageView tiles={tiles} />;
} 