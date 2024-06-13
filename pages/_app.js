// pages/_app.js

import { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { ColorModeProvider, useColorMode } from '../hooks/useColorMode';
import Sidebar from '@/components/Sidebar';
import '@/styles/globals.css';
import { lightTheme, darkTheme } from '../utils/theme';
import { useRouter } from 'next/router';

function AppContent({ Component, pageProps }) {
  const { mode } = useColorMode();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Determinar si estamos en la página de inicio de sesión
  const isLoginPage = router.pathname === '/auth/sign-in';

  return (
    <ThemeProvider theme={mode === 'light' ? lightTheme : darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', width: '100%' }}>
        {!isLoginPage && <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            transition: 'margin 0.3s',
            // marginLeft: !isLoginPage && collapsed ? '60px' : '240px',
            p: 3,
            width: '100%',
            overflowX: 'hidden',
          }}
        >
          <Component {...pageProps} />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <ColorModeProvider>
        <AppContent Component={Component} pageProps={pageProps} />
      </ColorModeProvider>
    </SessionProvider>
  );
}

export default MyApp;
