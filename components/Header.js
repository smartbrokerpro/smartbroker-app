import { Box, Flex, HStack, IconButton, useDisclosure, Stack, Link, useColorModeValue } from '@chakra-ui/react';
import { FaBars, FaTimes, FaFacebook, FaInstagram } from 'react-icons/fa';
import ColorModeSwitcher from './ColorModeSwitcher';

const Header = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bg = useColorModeValue('gray.800', 'gray.900');
  const color = useColorModeValue('white', 'gray.100');

  return (
    <Box bg={bg} color={color} px={4} transition="background-color 0.8s ease, color 0.8s ease">
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <Box fontWeight="bold">Smart Broker</Box>
        <HStack as="nav" spacing={4} display={{ base: 'none', md: 'flex' }}>
          <Link href="/">Home</Link>
          <Link href="/movies-table">Tabla</Link>
          <Link href="/movies">Tarjetas</Link>
          <Link href="#">Services</Link>
          <Link href="#">Contact</Link>
        </HStack>
        <HStack spacing={6} alignItems="center">
          <Link href="https://facebook.com" isExternal display={{ base: 'none', md: 'block' }}>
            <FaFacebook />
          </Link>
          <Link href="https://instagram.com" isExternal display={{ base: 'none', md: 'block' }}>
            <FaInstagram />
          </Link>
          <ColorModeSwitcher />
          <Box display={{ base: 'flex', md: 'none' }} alignItems="center">
            <IconButton
              size="md"
              icon={isOpen ? <FaTimes /> : <FaBars />}
              aria-label="Open Menu"
              onClick={isOpen ? onClose : onOpen}
            />
          </Box>
        </HStack>
      </Flex>
      {isOpen ? (
        <Box pb={4} display={{ md: 'none' }}>
          <Stack as="nav" spacing={4}>
            <Link href="#">Home</Link>
            <Link href="#">About</Link>
            <Link href="#">Services</Link>
            <Link href="#">Contact</Link>
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
};

export default Header;
