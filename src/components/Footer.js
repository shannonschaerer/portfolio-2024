import {
  Box,
  Container,
  Stack,
  Text,
  Link,
  useColorModeValue,
} from "@chakra-ui/react";
import {ExternalLinkIcon} from "@chakra-ui/icons";

export default function Footer() {
  return (
    <Box
      bg={useColorModeValue("gray.50", "gray.900")}
      color={useColorModeValue("gray.700", "gray.200")}
    >
      <Container
        as={Stack}
        maxW={"6xl"}
        py={4}
        align="center"
      >
        <Text>© 2024 Shannon Schärer</Text>
        <Link href='https://eldora.me/' fontSize='xs' isExternal>
          Template adapted from Eldora Boo <ExternalLinkIcon mt={-1}/>
        </Link>
      </Container>
    </Box>
  );
}
