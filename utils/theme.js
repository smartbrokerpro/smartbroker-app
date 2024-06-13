// utils/theme.js

import { createTheme } from '@mui/material/styles';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#FF9800' }, // Naranja brillante para el modo claro
    secondary: { main: '#FFB74D' }, // Naranja más claro
    third: { main: '#FFA726' }, // Otro tono de naranja
    background: {
      default: '#f0f0f0', // Fondo claro
      paper: '#FFFFFF', // Papel blanco
      header: '#ddd', // Fondo del Header para el modo claro
    },
    text: {
      primary: '#212121', // Texto negro
      secondary: '#757575', // Texto gris oscuro
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (min-width:600px)': {
            paddingLeft: '0px',
            paddingRight: '0px',
          },
        },
      },
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#FF7043' }, // Naranja oscuro para el modo oscuro
    secondary: { main: '#FF8A65' }, // Naranja más claro
    third: { main: '#FF5722' }, // Otro tono de naranja
    background: {
      default: '#212121', // Fondo oscuro
      paper: '#424242', // Papel más oscuro
      header: '#000000', // Fondo del Header para el modo oscuro
    },
    text: {
      primary: '#E0E0E0', // Texto gris claro
      secondary: '#BDBDBD', // Texto gris más claro
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (min-width:600px)': {
            paddingLeft: '0px',
            paddingRight: '0px',
          },
        },
      },
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  },
});

export { lightTheme, darkTheme };
