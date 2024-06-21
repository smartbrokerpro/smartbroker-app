// pages/_app.js
import { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { ColorModeProvider, useColorMode } from '../hooks/useColorMode';
import Sidebar from '@/components/Sidebar';
import RightSidebar from '@/components/RightSidebar';
import '@/styles/globals.css';
import { lightTheme, darkTheme } from '../utils/theme';
import { useRouter } from 'next/router';
import { appWithTranslation } from 'next-i18next';
import { i18n } from '../next-i18next.config.mjs';

function AppContent({ Component, pageProps }) {
  const { mode } = useColorMode();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const isLoginPage = router.pathname === '/auth/sign-in';

  return (
    <ThemeProvider theme={mode === 'light' ? lightTheme : darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
        {!isLoginPage && <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <Box sx={{ flexGrow: 1, overflow: 'auto', padding: 3 }}>
            <Component {...pageProps} />
          </Box>
        </Box>
        {!isLoginPage && <RightSidebar />}
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

export default appWithTranslation(MyApp, { i18n });
