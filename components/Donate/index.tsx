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
   Image,
   FaBtc,
   FaEthereum,
   Code,
   HStack,
   useToast,
   RiBnbFill,
   Divider,
   Flex,
} from "components";

import { useTranslations } from "next-intl";

type AddressWallet = {
   name: string;
   address: string;
   color: string;
   icon: any;
};
export const Donate = ({ isHeader = false }: { isHeader?: boolean }) => {
   const { isOpen, onOpen, onClose } = useDisclosure();
   const toast = useToast();
   const t = useTranslations("Donate");
   const [address] = useState<AddressWallet[]>([
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

   const copyAddress = (item: AddressWallet) => {
      navigator.clipboard.writeText(item.address);
      toast({
         title: t("copySuccess", { name: item.name }),
         status: "success",
         duration: 2_500,
         isClosable: true,
      });
   };
   return (
      <Box>
         <Modal
            isOpen={isOpen}
            onClose={onClose}
            size={["full", "md"]}
            scrollBehavior="inside"
         >
            <ModalOverlay />
            <ModalContent>
               <ModalHeader display="flex">
                  <Box as="span">{t("buyCoffee")}</Box>
                  <Box>
                     <Icon as={PiCoffeeBold} boxSize={6} mt="2px" ml="3px" />
                  </Box>
               </ModalHeader>
               <ModalCloseButton />
               <ModalBody p={[2, 3]}>
                  <VStack
                     divider={<StackDivider borderColor="gray.200" />}
                     spacing={4}
                     align="stretch"
                  >
                     <Box>
                        <Image
                           src="/Images/MomoQR.jpeg"
                           alt="Mobile Money QR Code"
                        />
                     </Box>
                     <Box>
                        {address.map((item, index) => (
                           <HStack key={item.address + index} py={1}>
                              <Tooltip label={item.name} hasArrow>
                                 <CustomCard>
                                    <Button
                                       onClick={() => copyAddress(item)}
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
                  <Divider my={4} />
               </ModalBody>
            </ModalContent>
         </Modal>

         <Tooltip label={t("buyCoffee")} hasArrow>
            <CustomCard as="button" onClick={onOpen} color={isHeader ? undefined : "orange.600"} p={isHeader ? 0 : undefined} m={isHeader ? 0 : 1} bg={isHeader ? "transparent" : undefined} shadow={isHeader ? "none" : undefined} border={isHeader ? "none" : undefined}>
               {isHeader ? (
                  <Flex boxSize={9} align="center" justify="center" rounded="full" _hover={{ bg: "blackAlpha.100", _dark: { bg: "whiteAlpha.200" } }} transition="all 0.2s" color="gray.700" _dark={{ color: "whiteAlpha.900" }}>
                     <Icon as={FaDonate} boxSize={5} />
                  </Flex>
               ) : (
                  <Icon
                     as={FaDonate}
                     boxSize={12}
                     border="3px solid"
                     rounded="100%"
                     _hover={{ color: "orange" }}
                  />
               )}
            </CustomCard>
         </Tooltip>
      </Box>
   );
};
