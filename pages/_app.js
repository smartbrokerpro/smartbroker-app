import { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { ColorModeProvider, useColorMode } from '../hooks/useColorMode';
import Sidebar from '@/components/Sidebar';
import RightSidebar from '@/components/RightSidebar';
import { NotificationProvider } from '@/context/NotificationContext';
import '@/styles/globals.css';
import { lightTheme, darkTheme } from '../utils/theme';
import { useRouter } from 'next/router';
import { appWithTranslation } from 'next-i18next';
import { i18n } from '../next-i18next.config.mjs';
import { SidebarProvider, useSidebarContext } from '@/context/SidebarContext';

function AppContent({ Component, pageProps }) {
  const { mode } = useColorMode();
  const router = useRouter();
  const { collapsed, setCollapsed } = useSidebarContext();

  const isLoginPage = router.pathname === '/auth/sign-in';

  return (
    <ThemeProvider theme={mode === 'light' ? lightTheme : darkTheme}>
      <CssBaseline />
      <NotificationProvider>
        <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
          {!isLoginPage && <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }} className="main-content">
            <Box sx={{ flexGrow: 1, overflow: 'auto', padding: 0 }} className="content">
              <Component {...pageProps} />
            </Box>
          </Box>
          {/* {!isLoginPage && <RightSidebar />} */}
        </Box>
      </NotificationProvider>
    </ThemeProvider>
  );
}

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <ColorModeProvider>
        <SidebarProvider>
          <AppContent Component={Component} pageProps={pageProps} />
        </SidebarProvider>
      </ColorModeProvider>
    </SessionProvider>
  );
}

export default appWithTranslation(MyApp, { i18n });
