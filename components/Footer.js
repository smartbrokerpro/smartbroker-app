import { Box, Container, Stack, Text, Link, HStack } from '@chakra-ui/react';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import ColorModeSwitcher from './ColorModeSwitcher';

const Footer = () => {
  return (
    <Box bg="gray.800" color="white" transition="background-color 0.8s ease, color 0.8s ease">
      <Container as={Stack} maxW="6xl" py={4}>
        <HStack spacing={6} justify="center">
          <Link href="https://facebook.com" isExternal>
            <FaFacebook />
          </Link>
          <Link href="https://instagram.com" isExternal>
            <FaInstagram />
          </Link>
          <ColorModeSwitcher />
        </HStack>
        <Text textAlign="center">© 2023 Smart Broker. All rights reserved.</Text>
        <HStack spacing={6} justify="center">
          <Link href="#">Terms & Conditions</Link>
          <Link href="#">Privacy Policy</Link>
        </HStack>
      </Container>
    </Box>
  );
};

export default Footer;
