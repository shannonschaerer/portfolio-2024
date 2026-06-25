import {
  Divider,
  Stack,
  Text,
  Container,
  Box,
  HStack,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Flex,
  Badge,
  List,
  ListItem,
  ListIcon,
  Button,
  ButtonGroup,
  Center,
} from "@chakra-ui/react";
import {MinusIcon} from "@chakra-ui/icons";
import { Fade } from "react-awesome-reveal";
import { useState } from "react";
import ExperienceArray from "./ExperienceArray";
import TagsArray from "./TagsArray";

export default function Experience({ color }) {
  const experience = ExperienceArray();
  const options = TagsArray("ExperienceTags");
  const [selected, setSelected] = useState("All");
  
  const handleSelected = (value) => {
    setSelected(value);
  };

  return (
    <>
      <Container maxW={"3xl"} id="experience">
        <Stack
          as={Box}
          textAlign={"center"}
          spacing={{ base: 8, md: 14 }}
          pb={{ base: 20, md: 36 }}
        >
          <Stack align="center" direction="row" px={4}>
            <HStack mx={4}>
              <Text color={`${color}.400`} fontWeight={800}>
                02
              </Text>
              <Text fontWeight={800}>Experience</Text>
            </HStack>
            <Divider orientation="horizontal" />
          </Stack>
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
          <Stack px={4} spacing={4}>
            {experience
              .filter((exp) => {
                if (selected === "All") {
                  return true;
                } else {
                  return exp.tags.includes(selected);
                }
              })
              .map((exp) => (
                <Fade bottom key={exp.company+Math.random()}>
                  <Card size="sm" borderRadius='none'>
                    <CardHeader>
                      <Flex flexDir={{
                        base: "column",
                        md: "row",
                      }} justifyContent="space-between">
                        <HStack
                          mb={{
                              base: 2,
                              md: 0,
                          }}>
                          <Box align="left">
                            <Text fontWeight={600}>{exp.company}</Text>
                            <Text>{exp.position}</Text>
                          </Box>
                        </HStack>
                        <Text
                          px={{
                          base: 0,
                          md: 2,
                          }}
                          fontWeight={300}
                          textAlign={{
                            base: "left",
                            md: "right",
                          }}>
                          {exp.duration}
                        </Text>
                      </Flex>
                    </CardHeader>
                    <CardBody>
                      <Flex>
                        <List align="left" spacing={1} listStylePos='outside' pl={6}>
                          {exp.listItems.map((item, index) => (
                            <ListItem key={index}>
                              <ListIcon
                                boxSize={4}
                                as={MinusIcon}
                                color={`${color}.500`}
                                ml={-6}
                              />
                              {item}
                            </ListItem>
                          ))}
                        </List>
                      </Flex>
                    </CardBody>
                    <CardFooter>
                      <HStack pt={4} flexWrap='wrap' rowGap={2} columnGap={2} spacing={0}>
                        {exp.badges.map((badge) => (
                          <Badge
                            key={badge.name}
                            colorScheme={badge.colorScheme}
                          >
                            {badge.name}
                          </Badge>
                        ))}
                      </HStack>
                    </CardFooter>
                  </Card>
                </Fade>
              ))}
          </Stack>
        </Stack>
      </Container>
    </>
  );
}
