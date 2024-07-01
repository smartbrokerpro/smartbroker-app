// components/Sidebar.js

import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Tooltip, Divider, Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import TableChartIcon from '@mui/icons-material/TableChart';
import MovieIcon from '@mui/icons-material/Movie';
import ServicesIcon from '@mui/icons-material/Build';
import ContactIcon from '@mui/icons-material/ContactMail';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ColorModeSwitcher from './ColorModeSwitcher';
import Image from 'next/image';

const Sidebar = ({ collapsed, onToggle }) => {
  const menuItems = [
    { text: 'Inicio', icon: <HomeIcon />, href: '/' },
    { text: 'Inmobiliarias', icon: <TableChartIcon />, href: '/real-estate-companies' },
    { text: 'Proyectos', icon: <MovieIcon />, href: '/projects' },
    { text: 'Stock', icon: <ServicesIcon />, href: '/stock' },
    { text: 'Clientes', icon: <ContactIcon />, href: '/clients' },
    { text: 'Cotizaciones', icon: <ContactIcon />, href: '/quotes' },
    { text: 'Reservas', icon: <ContactIcon />, href: '/reservations' },
    { text: 'Promesas', icon: <ContactIcon />, href: '/promises' },
    { text: 'Smarty', icon: <Image src="/images/smarty.svg" alt="Smarty" width={20} height={20}/>, href: '/smarty' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        borderRadius:'0!important',
        width: collapsed ? 60 : 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: collapsed ? 60 : 240,
          boxSizing: 'border-box',
          transition: 'width 0.3s',
          backgroundColor:'#0E0F10',
          color:'white',
          borderRadius:'0rem'

        },
        [`& .MuiListItemIcon-root`]: {
          color:'white',
        },
        transition:'.3s all'
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
                layout="fixed"
                style={{ cursor: 'pointer' }}
              />
            </Box>
          </ListItem>
          <ListItem button onClick={onToggle} align="right">
            <ListItemIcon>
              {collapsed ? <ChevronRightIcon/> : <MenuOpenIcon />}
            </ListItemIcon>
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
