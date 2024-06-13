import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import theme from '../lib/theme';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <Header />
      <Component {...pageProps} />
      <Footer />
    </ChakraProvider>
  );
}

export default MyApp;
