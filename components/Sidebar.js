// components/Sidebar.js

import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Tooltip, Divider, Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import StorageIcon from '@mui/icons-material/Storage';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ColorModeSwitcher from './ColorModeSwitcher';
import Image from 'next/image';

const Sidebar = ({ collapsed, onToggle }) => {
  const menuItems = [
    { text: 'Inicio', icon: <HomeIcon />, href: '/' },
    { text: 'Inmobiliarias', icon: <BusinessIcon />, href: '/movies-table' },
    { text: 'Proyectos', icon: <ApartmentIcon />, href: '/movies' },
    { text: 'Stock', icon: <StorageIcon />, href: '#' },
    { text: 'Clientes', icon: <PeopleIcon />, href: '#' },
    { text: 'Cotizaciones', icon: <ReceiptIcon />, href: '#' },
    { text: 'Reservas', icon: <BookmarkIcon />, href: '#' },
    { text: 'Promesas', icon: <AssignmentTurnedInIcon />, href: '#' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? 60 : 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: collapsed ? 60 : 240,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width 0.3s',
        },
      }}
    >
      <Box>
        <List>
          <ListItem>
            <Box sx={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start', width: '100%', p: 2 }}>
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={collapsed ? 40 : 120}
                height={40}
                layout="fixed"
                style={{ cursor: 'pointer' }}
              />
            </Box>
          </ListItem>
          <ListItem button onClick={onToggle}>
            <ListItemIcon>
              {collapsed ? <ChevronLeftIcon /> : <MenuOpenIcon />}
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Collapse Sidebar" />}
          </ListItem>
          <Divider />
          {menuItems.map((item) => (
            <Tooltip title={collapsed ? item.text : ''} placement="right" key={item.text}>
              <ListItem button component="a" href={item.href}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                {!collapsed && <ListItemText primary={item.text} />}
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </Box>
      <Box>
        <ColorModeSwitcher />
      </Box>
    </Drawer>
  );
};

export default Sidebar;
