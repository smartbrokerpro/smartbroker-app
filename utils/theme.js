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
        border: '1px solid rgba(0,0,0,0.2)',
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
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: '#0E0F10', // Estilo general para tooltips
        color: '#FFFFFF',
        fontSize: '0.875rem',
      },
      arrow: {
        color: '#0E0F10',
      },
      // Estilo específico para los tooltips de copiado
      popper: {
        '&.MuiTooltip-copied': {
          '& .MuiTooltip-tooltip': {
            backgroundColor: '#68B21Fee', // Fondo verde personalizado
            color: '#FFFFFF',
            fontSize: '0.75rem',
            borderRadius:'2rem',
            display:'flex',

          },
          '& .MuiTooltip-arrow': {
            color: '#68B21Fee', // Color de la flecha verde
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
      default: '#f0f0f0',
      paper: '#FFFFFF',
      header: '#ddd',
    },
    text: {
      primary: '#0E0F10',
      secondary: '#757575',
    },
  },
  components: {
    ...commonComponents,
  },
  typography: {
    fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
});

// const darkTheme = createTheme({
//   palette: {
//     mode: 'dark',
//     primary: { main: '#ffffff' },
//     secondary: { main: '#7BBF2A' },
//     third: { main: '#68B21F' },
//     background: {
//       default: '#0E0F10',
//       paper: '#424242',
//       header: '#0E0F10',
//     },
//     text: {
//       primary: '#E0E0E0',
//       secondary: '#BDBDBD',
//     },
//   },
//   components: {
//     ...commonComponents,
//   },
//   typography: {
//     fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
//   },
// });

export { lightTheme };
