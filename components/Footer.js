// components/Footer.js

import React from 'react';
import { Box, Container, Stack, Typography, Link, IconButton, useTheme } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import ColorModeSwitcher from './ColorModeSwitcher';

const Footer = () => {
  const theme = useTheme();

  return (
    <Box sx={{ bgcolor: theme.palette.background.paper, color: theme.palette.text.primary, transition: 'background-color 0.8s ease, color 0.8s ease', py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={2} justifyContent="center" alignItems="center">
          <Stack direction="row" spacing={1}>
            <IconButton href="https://facebook.com" target="_blank" color="inherit">
              <FacebookIcon />
            </IconButton>
            <IconButton href="https://instagram.com" target="_blank" color="inherit">
              <InstagramIcon />
            </IconButton>
            <ColorModeSwitcher />
          </Stack>
          <Typography variant="body2" align="center">© 2023 Smart Broker. All rights reserved.</Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Link href="#" color="inherit">Terms & Conditions</Link>
            <Link href="#" color="inherit">Privacy Policy</Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
