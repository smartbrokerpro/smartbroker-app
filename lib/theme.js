import { extendTheme } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";

const config = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const styles = {
  global: (props) => ({
    "html, body": {
      transition: "background-color 0.8s ease, color 0.8s ease",
      bg: mode("white", "gray.900")(props),
      color: mode("gray.900", "white")(props),
    },
    "#__next": {
      transition: "background-color 0.8s ease, color 0.8s ease",
      bg: mode("white", "gray.900")(props),
      color: mode("gray.900", "white")(props),
    },
  }),
};

const theme = extendTheme({ config, styles });

export default theme;
