import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Tooltip, Divider, Box, Avatar, Badge, Menu, MenuItem, IconButton, Typography, LinearProgress } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import GroupIcon from '@mui/icons-material/Group';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import Image from 'next/image';
import { ROLES } from '@/lib/auth/permissions/roles';
import { hasPermission } from '@/lib/auth/permissions/helpers';

const Sidebar = ({ collapsed, onToggle }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [maxCredits, setMaxCredits] = useState(4000);
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const [smartyOpen, setSmaryOpen] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);

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

  const canManageUsers = session?.user?.role === 'admin' || 
  (session?.user?.customPermissions?.users?.view === 1) ||
  (ROLES[session?.user?.role]?.permissions?.users?.view === 1);

  const handleSettingsClick = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };
  
  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };
  
  const handleNavigateToUsers = () => {
    router.push('/admin/users');
    handleSettingsClose();
  };
  
  const handleNavigateToProfile = () => {
    router.push(`/user/profile/${session?.user?.id}`);
    handleSettingsClose();
  };

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

  const handleSmartyClick = () => {
    setSmaryOpen(!smartyOpen);
  };

  const handleSubItemClick = (href) => {
    setSmaryOpen(false);
    router.push(href);
  };

  const menuItems = [
    { text: 'Inicio', icon: <HomeIcon />, href: '/', disabled: false },
    { text: 'Inmobiliarias', icon: <BusinessIcon />, href: '/real-estate-companies', disabled: false },
    { text: 'Proyectos', icon: <ApartmentIcon />, href: '/projects', disabled: false },
    { text: 'Clientes', icon: <GroupIcon />, href: '/clients', disabled: false },
    { text: 'Cotizaciones', icon: <AttachMoneyIcon />, href: '/quotations', disabled: false },
    { text: 'Reservas', icon: <EventAvailableIcon />, href: '/reservations', disabled: true },
    { text: 'Promesas', icon: <AssignmentTurnedInIcon />, href: '/promises', disabled: true },
    {
      text: 'Smarty',
      icon: <Image src="/images/smarty.svg" alt="Smarty" width={26} height={26} />,
      subItems: [
        { text: 'v1', href: '/smarty' },
        { text: 'v2', href: '/smarty/v2' }
      ],
      disabled: false
    },
  ];

  useEffect(() => {
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
          overflowX: 'hidden',
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
            <Box sx={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start', width: '100%', p: 2, position: 'relative' }}>
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={collapsed ? 40 : 40}
                height={40}
                style={{ cursor: 'pointer' }}
              />
              {!collapsed && environment && (
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    backgroundColor: environment === 'prod' ? 'red' : 'green',
                    color: 'white',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    fontSize: '0.5rem',
                    zIndex: 1,
                  }}
                >
                  {environment === 'prod' ? 'PROD' : 'DEV'}
                </Typography>
              )}
            </Box>
          </ListItem>
          <ListItem button onClick={onToggle} align="right">
            <ListItemIcon>
              {collapsed ? <ChevronRightIcon /> : <MenuOpenIcon />}
            </ListItemIcon>
          </ListItem>
          <Divider />
          {menuItems.map((item) => (
            item.subItems ? (
              <React.Fragment key={item.text}>
                <ListItem
                  button
                  onClick={handleSmartyClick}
                  sx={{
                    borderRadius: '0 2rem 2rem 0',
                    backgroundColor: isActiveRoute('/smarty') ? '#86DB2E' : 'inherit',
                    color: isActiveRoute('/smarty') ? 'black' : 'inherit',
                    '&:hover': {
                      backgroundColor: isActiveRoute('/smarty') ? '#86DB2E' : 'rgba(255, 255, 255, 0.1)',
                      color: isActiveRoute('/smarty') ? 'black' : 'white',
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  {!collapsed && (
                    <>
                      <ListItemText primary={item.text} />
                      <ExpandMoreIcon
                        sx={{
                          transform: smartyOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s',
                        }}
                      />
                    </>
                  )}
                </ListItem>
                {!collapsed && smartyOpen && (
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem) => (
                      <Link href={subItem.href} passHref key={subItem.text}>
                        <ListItem
                          button
                          key={subItem.text}
                          onClick={() => handleSubItemClick(subItem.href)}
    
                          sx={{
                            pl: 4,
                            backgroundColor: isActiveRoute(subItem.href) ? 'rgba(134, 219, 46, 0.1)' : 'inherit',
                            '&:hover': {
                              backgroundColor: 'rgba(134, 219, 46, 0.2)',
                            },
                          }}
                        >
                          <ListItemText primary={subItem.text} sx={{ pl: 2 }} />
                        </ListItem>
                      </Link>
                    ))}
                  </List>
                )}
              </React.Fragment>
            ) : (
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
            )
          ))}
        </List>
      </Box>
      
      <Box sx={{ px: 2, pb: 2 }}>
        <Divider sx={{ borderColor: '#333333' }} />
        <Box sx={{ pt: 2, height: 50, width: 'auto', position: 'relative' }}>
          <Image
            src={session?.user?.organization?.logo}
            alt={session?.user?.organization?.name}
            width={50}
            height={50}
            style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 2 }}>
          <Avatar alt={session?.user?.name} src={session?.user?.image} sx={{ width: 32, height: 32 }} />
          {!collapsed && (
            <Box sx={{ ml: 2 }}>
              <Typography sx={{ fontSize: '0.65rem' }}>{session?.user?.name}</Typography>
              <Typography sx={{ fontSize: '0.65rem', color: 'gray' }}>{session?.user?.email}</Typography>
            </Box>
          )}
        </Box>
        <Divider sx={{ borderColor: '#222222', borderStyle: 'dotted' }} />

        <Box sx={{ mt: 2, mb: 2 }}>
          <LinearProgress variant="determinate" value={(currentCredits / maxCredits) * 100} sx={{ height: 10, borderRadius: 5, backgroundColor: 'gray', '& .MuiLinearProgress-bar': { backgroundColor: '#86DB2E' } }} />
          <Typography variant="caption" sx={{ color: 'white' }}>
            {currentCredits} / {maxCredits} créditos
          </Typography>
        </Box>

        <Divider sx={{ borderColor: '#222222', borderStyle: 'dotted' }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', mt: 2 }}>
          <Tooltip title="Configuración" placement="top">
            <IconButton 
              sx={{ color: 'white' }} 
              onClick={handleSettingsClick}
            >
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
          anchorEl={settingsAnchorEl}
          open={Boolean(settingsAnchorEl)}
          onClose={handleSettingsClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              minWidth: '160px',
              backgroundColor: '#1A1B1C',
              border: '1px solid #333333',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              '& .MuiMenuItem-root': {
                py: 0.5,
                px: 1.5,
                fontSize: '0.75rem',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(134, 219, 46, 0.1)',
                },
              },
              '& .MuiListItemIcon-root': {
                minWidth: '32px',
                color: '#86DB2E',
                '& svg': {
                  fontSize: '1rem'
                }
              },
              '& .MuiDivider-root': {
                borderColor: '#333333',
                margin: '4px 0',
              }
            }
          }}
        >
          <MenuItem onClick={handleNavigateToProfile}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Mi perfil" 
              primaryTypographyProps={{
                sx: { 
                  fontSize: '0.75rem',
                  fontWeight: 400
                }
              }}
            />
          </MenuItem>
          
          {hasPermission(session?.user, 'users', 'view') && (
            <>
              <Divider />
              <MenuItem onClick={handleNavigateToUsers}>
                <ListItemIcon>
                  <GroupIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Administrar usuarios" 
                  primaryTypographyProps={{
                    sx: { 
                      fontSize: '0.75rem',
                      fontWeight: 400
                    }
                  }}
                />
              </MenuItem>
            </>
          )}
        </Menu>
      </Box>
    </Drawer>
  );
};

export default Sidebar;