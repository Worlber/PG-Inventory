import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Info as InfoIcon,
  AccountCircle,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import GlobalSearch from '../search/GlobalSearch';
import Footer from './Footer';

const DRAWER_WIDTH = 240;

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const navItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    ...(user?.role === 'admin'
      ? [{ label: 'User Management', icon: <PeopleIcon />, path: '/users' }]
      : []),
    { label: 'About', icon: <InfoIcon />, path: '/about' },
  ];

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/login');
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <img
          src="/logo.png"
          alt="Worlber PG Inventory"
          style={{ maxWidth: '100%', height: 'auto', display: 'block', mixBlendMode: 'screen' }}
        />
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            sx={{
              mx: 1,
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'rgba(255,255,255,0.15)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
              },
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.8)', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              sx={{ '& .MuiListItemText-primary': { color: '#FFFFFF', fontSize: '0.9rem' } }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, position: 'relative' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
        }}
      >
        {drawer}
      </Drawer>

      {/* Main content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E0E0E0' }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 2, display: { md: 'none' }, color: '#1A1A1A' }}
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ flexGrow: 1, maxWidth: 500 }}>
              <GlobalSearch />
            </Box>

            <Box sx={{ ml: 'auto' }}>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar sx={{ bgcolor: '#2D5A3D', width: 32, height: 32, fontSize: '0.875rem' }}>
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
              >
                <MenuItem disabled>
                  <Typography variant="body2">
                    {user?.username} ({user?.role})
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
                  My Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#F5F7F5' }}>
          {children}
        </Box>

        <Footer />
      </Box>
    </Box>
  );
}
