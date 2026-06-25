// theme.js

// 1. import `extendTheme` function
import { extendTheme, defineStyleConfig } from "@chakra-ui/react";
import '@fontsource/raleway';

// 2. Add your color mode config
const config = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};


const fonts = {
  heading: `'Raleway', sans-serif`,
  body: `'Raleway', sans-serif`,
}

const Button = defineStyleConfig({
  baseStyle: {
    borderRadius: 'none'
  },
})


// 3. extend the theme
const theme = extendTheme({ config, fonts, components: { Button } });

export default theme;
