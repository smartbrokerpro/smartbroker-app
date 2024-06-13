// components/ColorModeSwitcher.js

import React from 'react';
import { IconButton, useTheme } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useColorMode } from '../hooks/useColorMode';

const ColorModeSwitcher = () => {
  const { toggleColorMode } = useColorMode();
  const theme = useTheme();

  return (
    <IconButton onClick={toggleColorMode} color="inherit">
      {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
    </IconButton>
  );
};

export default ColorModeSwitcher;
