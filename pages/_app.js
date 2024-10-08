import { SessionProvider } from 'next-auth/react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { ColorModeProvider, useColorMode } from '../hooks/useColorMode';
import Sidebar from '@/components/Sidebar';
import { NotificationProvider } from '@/context/NotificationContext';
import '@/styles/globals.css';
import { lightTheme } from '../utils/theme';
import { useRouter } from 'next/router';
import { SidebarProvider, useSidebarContext } from '@/context/SidebarContext';
import HotjarScript from '../components/HotjarScript'
import Head from 'next/head'

function AppContent({ Component, pageProps }) {
  const { mode } = useColorMode();
  const router = useRouter();
  const { collapsed, setCollapsed } = useSidebarContext();

  const isLoginPage = router.pathname === '/auth/sign-in';

  return (
    <>
      <Head>
        <title>SmartBroker Pro</title>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css"
          integrity="sha384-Xi8rHCmBmhbuyyhbI88391ZKP2dmfnOl4rT9ZfRI7mLTdk1wblIUnrIq35nqwEvC"
          crossOrigin="anonymous"
        />
      </Head>
      <HotjarScript />

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
          </Box>
        </NotificationProvider>
      </ThemeProvider>
    </>
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

export default MyApp;