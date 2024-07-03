import { createTheme } from '@mui/material/styles';

const commonComponents = {
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
  MuiCardContent: {
    styleOverrides: {
      root: {
        '&:last-child': {
          paddingBottom: 0,
        },
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        '&.MuiButton-containedPrimary': {
          backgroundColor: '#86DB2E',
          color: 'white',
        },
        '&.MuiButton-containedSecondary': {
          backgroundColor: '#7BBF2A',
          color: 'white',
        },
        '&.MuiButton-contained': {
          backgroundColor: '#68B21F',
          color: 'white',
        },
      },
    },
  },
  MuiFab: {
    styleOverrides: {
      root: {
        '&.MuiFab-primary': {
          backgroundColor: '#86DB2E',
          color: 'white',
        },
        '&.MuiFab-secondary': {
          backgroundColor: '#7BBF2A',
          color: 'white',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        '&.MuiChip-filledPrimary': {
          backgroundColor: '#86DB2E',
          color: 'white',
        },
        '&.MuiChip-filledSecondary': {
          backgroundColor: '#7BBF2A',
          color: 'white',
        },
        '&.MuiChip-outlinedPrimary': {
          borderColor: '#86DB2E',
          color: '#5DA010',
        },
        '&.MuiChip-outlinedSecondary': {
          borderColor: '#86DB2E',
          color: '#86DB2E',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: '1rem', // Bordes redondeados para Paper
      },
    },
  },
  MuiPopover: {
    styleOverrides: {
      paper: {
        boxShadow: 'none', // Eliminar el box-shadow del Popover
        borderRadius: '1rem',
        border:'1px solid rgba(0,0,0,0.2)',
      },
    },
  },
  MuiAccordion: {
    styleOverrides: {
      root: {
        marginBottom: '8px', // Espacio entre acordeones
        '&:before': {
          display: 'none', // Eliminar la línea antes del acordeón
        },
        borderRadius: '1rem', // Bordes redondeados para acordeones
      },
    },
  },
  MuiAccordionSummary: {
    styleOverrides: {
      root: {
        minHeight: '40px', // Altura mínima para acordeones
        '&.Mui-expanded': {
          minHeight: '40px',
        },
        borderRadius: '8px', // Bordes redondeados para el resumen del acordeón
      },
      content: {
        '&.Mui-expanded': {
          margin: '12px 0',
        },
      },
    },
  },
  MuiCollapse: {
    styleOverrides: {
      root: {
        '&.MuiTableCell-root': {
          borderRadius: '1rem', // Bordes redondeados para elementos colapsables en tablas
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: '#ccc',
            borderRadius: '1rem',
          },
          '&:hover fieldset': {
            borderColor: '#ccc !important',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#ccc !important',
          },
        },
      },
    },
  },
};

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0E0F10' }, 
    secondary: { main: '#A4E844' }, 
    third: { main: '#89DE32' }, 
    background: {
      default: '#f0f0f0', // Fondo claro
      paper: '#FFFFFF', // Papel blanco
      header: '#ddd', // Fondo del Header para el modo claro
    },
    text: {
      primary: '#0E0F10', // Texto negro
      secondary: '#757575', // Texto gris oscuro
    },
  },
  components: {
    ...commonComponents,
    MuiTypography: {
      styleOverrides: {
        h1: {
          color: '#0E0F10', // Color de los títulos para el modo claro
        },
        h2: {
          color: '#0E0F10', // Color de los títulos para el modo claro
        },
        h3: {
          color: '#0E0F10', // Color de los títulos para el modo claro
        },
        h4: {
          color: '#0E0F10', // Color de los títulos para el modo claro
        },
        h5: {
          color: '#0E0F10', // Color de los títulos para el modo claro
        },
        h6: {
          color: '#0E0F10', // Color de los títulos para el modo claro
        },
      },
    },
  },
  typography: {
    fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#ffffff' }, // Verde oscuro para el modo oscuro
    secondary: { main: '#7BBF2A' }, // Verde más claro
    third: { main: '#68B21F' }, // Otro tono de verde
    background: {
      default: '#0E0F10', // Fondo oscuro
      paper: '#424242', // Papel más oscuro
      header: '#0E0F10', // Fondo del Header para el modo oscuro
    },
    text: {
      primary: '#E0E0E0', // Texto gris claro
      secondary: '#BDBDBD', // Texto gris más claro
    },
  },
  components: {
    ...commonComponents,
    MuiTypography: {
      styleOverrides: {
        h1: {
          color: '#E0E0E0', // Color de los títulos para el modo oscuro
        },
        h2: {
          color: '#E0E0E0', // Color de los títulos para el modo oscuro
        },
        h3: {
          color: '#E0E0E0', // Color de los títulos para el modo oscuro
        },
        h4: {
          color: '#E0E0E0', // Color de los títulos para el modo oscuro
        },
        h5: {
          color: '#E0E0E0', // Color de los títulos para el modo oscuro
        },
        h6: {
          color: '#E0E0E0', // Color de los títulos para el modo oscuro
        },
      },
    },
  },
  typography: {
    fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
});

export { lightTheme, darkTheme };
