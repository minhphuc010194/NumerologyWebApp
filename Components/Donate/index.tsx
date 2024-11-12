import { useState } from "react";
import {
  Box,
  CustomCard,
  Icon,
  FaDonate,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  ModalHeader,
  Button,
  PiCoffeeBold,
  VStack,
  StackDivider,
  Input,
  Image,
  ButtonGroup,
  IconButton,
  FaBtc,
  FaEthereum,
  Code,
  HStack,
  useToast,
  RiBnbFill,
} from "Components";

export const Donate = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [address, setAdress] = useState([
    {
      name: "Bitcoin",
      address: "1NTP9TcpYQL6nHyiNgyQ1ekL2kXDsdcrAt",
      color: "gold",
      icon: FaBtc,
    },
    {
      name: "Ethereum",
      address: "0x86521cff9079c4cb791985dad5ab3c7dd2b14ac6",
      color: "gray",
      icon: FaEthereum,
    },
    {
      name: "BNB",
      address: "0x86521cff9079c4cb791985dad5ab3c7dd2b14ac6",
      color: "orange",
      icon: RiBnbFill,
    },
  ]);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copied successfully",
      status: "success",
      duration: 1_500,
      isClosable: true,
    });
  };
  return (
    <Box>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader display="flex">
            <Box as="span">Buy me a coffee</Box>
            <Box>
              <Icon as={PiCoffeeBold} boxSize={6} mt="2px" ml="3px" />
            </Box>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack
              divider={<StackDivider borderColor="gray.200" />}
              spacing={4}
              align="stretch"
            >
              <Box>
                <Image src="/images/MomoQR.jpeg" />
              </Box>
              <Box>
                {address.map((item, index) => (
                  <HStack key={item.address + index} py={1}>
                    <Tooltip label={item.name} hasArrow>
                      <CustomCard>
                        <Button
                          onClick={() => copyAddress(item.address)}
                          color={item.color}
                          variant="outline"
                          size="sm"
                          w="30px"
                        >
                          <Icon as={item.icon} />
                        </Button>
                        <Code ml={1}>{item.address}</Code>
                      </CustomCard>
                    </Tooltip>
                  </HStack>
                ))}
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Tooltip label="By me a coffee" hasArrow>
        <CustomCard as="button" onClick={onOpen}>
          <Icon
            as={FaDonate}
            boxSize={12}
            border="3px solid"
            rounded="100%"
            _hover={{ color: "orange" }}
          />
        </CustomCard>
      </Tooltip>
    </Box>
  );
};
