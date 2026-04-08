import { useState } from 'react';
import {
  Box,
  CustomCard,
  Icon,
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
  Text,
  IconButton,
  MdContentCopy,
} from 'components';

import { useTranslations } from 'next-intl';

type AddressWallet = {
  name: string;
  address: string;
  color: string;
  icon: any;
};
export const Donate = ({ isHeader = false }: { isHeader?: boolean }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const t = useTranslations('Donate');
  const [address] = useState<AddressWallet[]>([
    {
      name: 'Bitcoin',
      address: '1NTP9TcpYQL6nHyiNgyQ1ekL2kXDsdcrAt',
      color: 'gold',
      icon: FaBtc
    },
    {
      name: 'Ethereum',
      address: '0x86521cff9079c4cb791985dad5ab3c7dd2b14ac6',
      color: 'gray',
      icon: FaEthereum
    },
    {
      name: 'BNB',
      address: '0x86521cff9079c4cb791985dad5ab3c7dd2b14ac6',
      color: 'orange',
      icon: RiBnbFill
    }
  ]);

  const copyAddress = (item: AddressWallet) => {
    navigator.clipboard.writeText(item.address);
    toast({
      title: t('copySuccess', { name: item.name }),
      status: 'success',
      duration: 2_500,
      isClosable: true
    });
  };
  return (
    <Box>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={['full', 'md']}
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader display="flex">
            <Box as="span">{t('buyCoffee')}</Box>
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
                <Image src="/Images/MomoQR.jpeg" alt="Mobile Money QR Code" />
              </Box>
              <Box>
                {address.map((item, index) => (
                  <Box key={item.address + index} py={2}>
                    <CustomCard p={3} borderWidth="1px" shadow="sm" borderRadius="xl">
                      <Flex align="center" justify="space-between" mb={2}>
                        <HStack spacing={2}>
                          <Icon as={item.icon} color={item.color} boxSize={5} />
                          <Text fontWeight="600" fontSize="sm">{item.name}</Text>
                        </HStack>
                        <Tooltip label={t('copySuccess', { name: item.name }).replace(' thành công', '')} hasArrow>
                          <IconButton
                            aria-label="Copy Address"
                            icon={<Icon as={MdContentCopy} />}
                            onClick={() => copyAddress(item)}
                            size="sm"
                            variant="ghost"
                            rounded="full"
                            color="gray.500"
                            _dark={{ color: 'whiteAlpha.700' }}
                            _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.200' } }}
                          />
                        </Tooltip>
                      </Flex>
                      <Box
                        p={2}
                        bg="blackAlpha.50"
                        _dark={{ bg: 'whiteAlpha.100' }}
                        rounded="md"
                        overflowX="auto"
                        whiteSpace="nowrap"
                        cursor="pointer"
                        onClick={() => copyAddress(item)}
                        _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.200' } }}
                        transition="all 0.2s"
                      >
                        <Code fontSize="xs" bg="transparent" borderRadius="0">{item.address}</Code>
                      </Box>
                    </CustomCard>
                  </Box>
                ))}
              </Box>
            </VStack>
            <Divider my={4} />
          </ModalBody>
        </ModalContent>
      </Modal>

      <Tooltip label={t('buyCoffee')} hasArrow>
        <Flex
          as="button"
          onClick={onOpen}
          boxSize={10}
          align="center"
          justify="center"
          rounded="full"
          bgGradient="linear(to-r, orange.400, yellow.500)"
          color="white"
          shadow="sm"
          _hover={{
            transform: 'scale(1.1)',
            shadow: 'md',
            bgGradient: 'linear(to-r, orange.500, yellow.600)'
          }}
          transition="all 0.2s"
        >
          <Icon as={PiCoffeeBold} boxSize={5} />
        </Flex>
      </Tooltip>
    </Box>
  );
};
