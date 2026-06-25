import {
  Divider,
  Stack,
  Text,
  Container,
  Box,
  HStack,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  Image,
  Heading,
  SimpleGrid,
  Badge,
  Link,
  Center,
} from "@chakra-ui/react";
import { Fade } from "react-awesome-reveal";
import { useState } from "react";
import ProjectsArray from "./ProjectsArray";
import OtherProjectsArray from "./OtherProjectsArray";
import TagsArray from "./TagsArray";

export default function Projects({ color }) {
    const projects = ProjectsArray();
    const others = OtherProjectsArray();
    const options = TagsArray("ProjectsTags");
    
    const [selected, setSelected] = useState("All");

    const handleSelected = (value) => {
      setSelected(value);
    };
    
  return (
    <>
      <Container maxW={"3xl"} id="projects">
        <Stack
          as={Box}
          textAlign={"center"}
          spacing={{ base: 8, md: 14 }}
          pb={{ base: 20, md: 36 }}
        >
          <Stack align="center" direction="row" p={4}>
            <HStack mx={4}>
              <Text color={`${color}.400`} fontWeight={800}>
                03
              </Text>
              <Text fontWeight={800}>Projects</Text>
            </HStack>
            <Divider orientation="horizontal" />
          </Stack>
          <Stack px={4} spacing={4}>
            {projects.map((project) => (
              <Fade bottom key={project.name+Math.random()}>
                <Card
                  key={project.name}
                  direction={{
                    base: "column",
                  }}
                  overflow="hidden"
                  borderRadius='none'
                >
                  <Image objectFit="cover" src={project.image} />
                  <Stack>
                    <CardBody align="left">
                      <Text pb={2} align='left'>{project.year}</Text>
                      <Heading size="md">{project.name}</Heading>

                      <Text py={2}>{project.description}</Text>

                      <HStack py={2}>
                        {project.buttons.map((button) => (
                          <a key={button.text} href={button.href}>
                            <Button color={`${color}.400`}>
                              {button.text}
                            </Button>
                          </a>
                        ))}
                      </HStack>
                      <HStack pt={4} flexWrap='wrap' rowGap={2} columnGap={2} spacing={0}>
                        {project.badges.map((badge) => (
                          <Badge
                            key={badge.text}
                            colorScheme={badge.colorScheme}
                            spacing={2}
                          >
                            {badge.text}
                          </Badge>
                        ))}
                      </HStack>
                    </CardBody>
                  </Stack>
                </Card>
              </Fade>
            ))}
          </Stack>
          <Text color={"gray.600"} fontSize={"xl"} px={4}>
            Other Projects
          </Text>
          <Center px={4}>
            <ButtonGroup variant="outline">
              <HStack flexWrap='wrap' rowGap={2} columnGap={2} spacing={0}>
              <Button
                colorScheme={selected === "All" ? `${color}` : "gray"}
                onClick={() => handleSelected("All")}
              >
                All
              </Button>
              {options.map((option) => (
                <Button
                  colorScheme={selected === option.value ? `${color}` : "gray"}
                  onClick={() => handleSelected(option.value)}
                  key={option.value}
                >
                  {option.value}
                </Button>
              ))}
              </HStack>
            </ButtonGroup>
          </Center>
          <SimpleGrid columns={[1, 2, 3]} px={4} spacing={4}>
            {others
              .filter((other) => {
                if (selected === "All") {
                  return true;
                } else {
                  return other.tags[0].includes(selected);
                }
              })
              .map((other) => (
                <Fade bottom key={other.name+Math.random()}>
                  <Card borderRadius='none'>
                    <Image objectFit="cover" src={other.image} />
                    <Stack>
                      <CardBody align="left" h={[null, "40vh"]}>
                        <Text pb={1} align='left'>{other.year}</Text>
                        <Heading size="sm">{other.name}</Heading>
                        <HStack pt={4} flexWrap='wrap' rowGap={2} columnGap={2} spacing={0}>
                          {other.badges.map((badge) => (
                            <Badge
                              key={badge.text}
                              colorScheme={badge.colorScheme}
                            >
                              {badge.text}
                            </Badge>
                          ))}
                        </HStack>
                        <HStack pt={4} spacing={2}>
                          {other.buttons.map((button) => (
                              <Link
                                  key={button.text}
                                  href={button.href}
                                  color={`${color}.400`}
                              >
                                {button.text}
                              </Link>
                          ))}
                        </HStack>
                      </CardBody>
                    </Stack>
                  </Card>
                </Fade>
              ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </>
  );
}
