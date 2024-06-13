// pages/_app.js

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ColorModeProvider } from '../hooks/useColorMode';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import '@/styles/globals.css';
import { lightTheme, darkTheme } from '../utils/theme';

function MyApp({ Component, pageProps }) {
  return (
    <SessionProvider session={pageProps.session}>
      <ColorModeProvider>
        <CssBaseline />
        <Header />
        <Component {...pageProps} />
        <Footer />
      </ColorModeProvider>
    </SessionProvider>
  );
}

export default MyApp;
