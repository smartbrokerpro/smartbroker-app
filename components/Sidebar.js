import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Tooltip, Divider, Box, Avatar, Badge, Menu, MenuItem, IconButton, Typography, LinearProgress } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import InventoryIcon from '@mui/icons-material/Inventory';
import GroupIcon from '@mui/icons-material/Group';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import Image from 'next/image';
import ColorModeSwitcher from './ColorModeSwitcher';

const Sidebar = ({ collapsed, onToggle }) => {
  const router = useRouter();
  const { data: session } = useSession();
  console.log("session", session);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [maxCredits, setMaxCredits] = useState(4000); // Total de créditos

  useEffect(() => {
    const fetchCredits = async () => {
      if (session?.user?.organization?._id) {
        try {
          const response = await fetch(`/api/organization/${session.user.organization._id}/credits`);
          if (response.ok) {
            const data = await response.json();
            setCurrentCredits(data.credits.current);
            setMaxCredits(data.credits.max);
          } else {
            console.error('Failed to fetch credits');
          }
        } catch (error) {
          console.error('Error fetching credits:', error);
        }
      }
    };

    fetchCredits();
  }, [session]);

  const handleAlertsClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleAlertsClose = () => {
    setAnchorEl(null);
  };

  const isActiveRoute = (href) => {
    const pathname = router.pathname.split('/')[1];
    const hrefPath = href.split('/')[1];
    return pathname === hrefPath;
  };

  const menuItems = [
    { text: 'Inicio', icon: <HomeIcon />, href: '/', disabled: false },
    { text: 'Inmobiliarias', icon: <BusinessIcon />, href: '/real-estate-companies', disabled: false },
    { text: 'Proyectos', icon: <ApartmentIcon />, href: '/projects', disabled: false },
    { text: 'Clientes', icon: <GroupIcon />, href: '/clients', disabled: false },
    { text: 'Cotizaciones', icon: <AttachMoneyIcon />, href: '/quotes', disabled: true },
    { text: 'Reservas', icon: <EventAvailableIcon />, href: '/reservations', disabled: true },
    { text: 'Promesas', icon: <AssignmentTurnedInIcon />, href: '/promises', disabled: true },
    { text: 'Smarty', icon: <Image src="/images/smarty.svg" alt="Smarty" width={26} height={26} />, href: '/smarty', disabled: false },
  ];

  useEffect(() => {
    // Event listener for credit updates
    const handleCreditUpdate = (event) => {
      const { credits } = event.detail;
      setCurrentCredits(credits);
    };

    window.addEventListener('creditUpdate', handleCreditUpdate);

    return () => {
      window.removeEventListener('creditUpdate', handleCreditUpdate);
    };
  }, []);

  return (
    <Drawer
      variant="permanent"
      sx={{
        borderRadius: '0!important',
        width: collapsed ? 60 : 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: collapsed ? 60 : 240,
          boxSizing: 'border-box',
          transition: 'width 0.3s',
          backgroundColor: '#0E0F10',
          color: 'white',
          borderRadius: '0rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
        [`& .MuiListItemIcon-root`]: {
          color: 'white',
        },
        transition: '.3s all'
      }}
    >
      <Box>
        <List>
          <ListItem>
            <Box sx={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start', width: '100%', p: 2 }}>
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={collapsed ? 40 : 40}
                height={40}
                style={{ cursor: 'pointer' }}
              />
            </Box>
          </ListItem>
          <ListItem button onClick={onToggle} align="right">
            <ListItemIcon>
              {collapsed ? <ChevronRightIcon /> : <MenuOpenIcon />}
            </ListItemIcon>
          </ListItem>
          <Divider />
          {menuItems.map((item) => (
          <Tooltip title={collapsed ? item.text : ''} placement="right" key={item.text}>
            <Link href={item.href} passHref>
              <ListItem 
                button 
                disabled={item.disabled}
                sx={{
                  borderRadius: '0 2rem 2rem 0',
                  backgroundColor: isActiveRoute(item.href) ? '#86DB2E' : 'inherit',
                  color: isActiveRoute(item.href) ? 'black' : 'inherit',
                  '&:hover': {
                    backgroundColor: isActiveRoute(item.href) ? '#86DB2E' : 'rgba(255, 255, 255, 0.1)',
                    color: isActiveRoute(item.href) ? 'black' : 'white',
                  },
                  pointerEvents: item.disabled ? 'none' : 'auto',
                  opacity: item.disabled ? 0.5 : 1,
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                {!collapsed && <ListItemText primary={item.text} />}
              </ListItem>
            </Link>
          </Tooltip>
        ))}

        </List>
      </Box>
      
      <Box sx={{ px: 2, pb: 2 }}>
        <Divider sx={{borderColor:'#333333'}}/>
        <Box sx={{ pt: 2, height: 50, width: 'auto', position: 'relative' }}>
          <Image
            src={session?.user?.organization?.logo}
            alt={session?.user?.organization?.name}
            width={50}
            height={50}
            style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb:2 }}>
          <Avatar alt={session?.user?.name} src={session?.user?.image} sx={{ width: 32, height: 32 }} />
          {!collapsed && (
            <Box sx={{ ml: 2 }}>
              <Typography sx={{ fontSize: '0.65rem' }}>{session?.user?.name}</Typography>
              <Typography sx={{ fontSize: '0.65rem', color: 'gray' }}>{session?.user?.email}</Typography>
            </Box>
          )}
        </Box>
        <Divider sx={{borderColor:'#222222', borderStyle:'dotted'}}/>
        
        {/* Nueva sección para los créditos */}
        <Box sx={{ mt: 2, mb: 2 }}>
          
          <LinearProgress variant="determinate" value={(currentCredits / maxCredits) * 100} sx={{ height: 10, borderRadius: 5, backgroundColor: 'gray', '& .MuiLinearProgress-bar': { backgroundColor: '#86DB2E' } }} />
          <Typography variant="caption" sx={{ color: 'white' }}>
            {currentCredits} / {maxCredits} créditos
          </Typography>
        </Box>

        <Divider sx={{borderColor:'#222222', borderStyle:'dotted'}}/>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', mt: 2 }}>
          <Tooltip title="Configuración" placement="top">
            <IconButton sx={{ color: 'white' }}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Alertas" placement="top">
            <IconButton sx={{ color: 'white' }} onClick={handleAlertsClick}>
              <Badge badgeContent={1} color="success">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Cerrar sesión" placement="top">
            <IconButton sx={{ color: 'white' }} onClick={() => signOut()}>
              <ExitToAppIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleAlertsClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <MenuItem onClick={handleAlertsClose}>Sin alertas</MenuItem>
        </Menu>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
