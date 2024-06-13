// components/Header.js

import React, { useState } from 'react';
import { AppBar, Box, Stack, Toolbar, IconButton, Typography, Button, Menu, MenuItem, Link as MuiLink } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import { useTheme } from '@mui/material/styles';
import ColorModeSwitcher from './ColorModeSwitcher';
import Image from 'next/image';

const Header = () => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const isMenuOpen = Boolean(anchorEl);

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: theme.palette.background.header,
        color: theme.palette.text.primary,
        px: 4,
        transition: 'background-color 0.8s ease, color 0.8s ease',
      }}
    >
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', height: '100%' }}>
          <Image
            src="/images/logo.png"
            alt="Logo"
            layout="intrinsic"
            width={65} 
            height={65}
            style={{ maxHeight: '100%', width: 'auto' }}
          />
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1 }}>
          <Button color="inherit" href="/">Home</Button>
          <Button color="inherit" href="/movies-table">Tabla</Button>
          <Button color="inherit" href="/movies">Tarjetas</Button>
          <Button color="inherit" href="#">Services</Button>
          <Button color="inherit" href="#">Contact</Button>
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          <Stack direction="row" spacing={1}>
            <IconButton href="https://facebook.com" target="_blank" color="inherit">
              <FacebookIcon />
            </IconButton>
            <IconButton href="https://instagram.com" target="_blank" color="inherit">
              <InstagramIcon />
            </IconButton>
            <ColorModeSwitcher />
          </Stack>
        </Box>
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMenuOpen}
          >
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </Box>
      </Toolbar>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        keepMounted
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={isMenuOpen}
        onClose={handleMenuClose}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <MenuItem onClick={handleMenuClose} component={MuiLink} href="/">Home</MenuItem>
        <MenuItem onClick={handleMenuClose} component={MuiLink} href="#">About</MenuItem>
        <MenuItem onClick={handleMenuClose} component={MuiLink} href="#">Services</MenuItem>
        <MenuItem onClick={handleMenuClose} component={MuiLink} href="#">Contact</MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Header;
