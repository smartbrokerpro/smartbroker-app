import { IconButton, useColorMode } from '@chakra-ui/react';
import { FaSun, FaMoon } from 'react-icons/fa';

const ColorModeSwitcher = (props) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const icon = colorMode === 'light' ? <FaMoon /> : <FaSun />;

  return (
    <IconButton
      icon={icon}
      isRound="true"
      size="md"
      alignSelf="center"
      onClick={toggleColorMode}
      {...props}
    />
  );
};

export default ColorModeSwitcher;
