'use client';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Icon,
  Text,
  Box,
  useColorModeValue
} from '@chakra-ui/react';
import {
  MdOutlineAutoAwesome,
  MdOutlineLibraryBooks,
  MdShield,
  MdOutlineCloudUpload,
  MdVpnKey,
  MdArrowForward,
  MdSettings,
  MdMenu,
  MdAdd,
  MdFileDownload,
  MdArrowDownward
} from 'react-icons/md';

interface ChatGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => string;
}

export function ChatGuideModal({ isOpen, onClose, t }: ChatGuideModalProps) {
  const iconBg = useColorModeValue('brand.100', 'brand.900');
  const iconColor = useColorModeValue('brand.600', 'brand.200');

  const guides: Array<{
    icon: any;
    text: React.ReactNode;
    visual?: React.ReactNode;
  }> = [
    {
      icon: MdOutlineAutoAwesome,
      text: t('guideDesc1')
    },
    {
      icon: MdShield,
      text: t('guideDesc3')
    },
    {
      icon: MdOutlineLibraryBooks,
      text: t('guideDesc2'),
      visual: (
        <HStack
          mt={1}
          p={3}
          bg={useColorModeValue('gray.50', 'whiteAlpha.50')}
          borderRadius="md"
          border="1px dashed"
          borderColor={useColorModeValue('gray.200', 'whiteAlpha.300')}
          w="full"
          justify="flex-start"
          flexWrap="wrap"
          gap={2}
        >
          <Button size="xs" variant="outline" leftIcon={<Icon as={MdMenu} />} flexShrink={0}>
            {t('chatHistory')}
          </Button>
          <Icon as={MdArrowForward} color="gray.500" flexShrink={0} />
          <Button size="xs" colorScheme="brand" leftIcon={<Icon as={MdAdd} />} whiteSpace="normal" h="auto" py={1} textAlign="left">
            {t('newChat')}
          </Button>
        </HStack>
      )
    },

    {
      icon: MdOutlineCloudUpload,
      text: t('guideDesc4'),
      visual: (
        <HStack
          mt={1}
          p={3}
          bg={useColorModeValue('gray.50', 'whiteAlpha.50')}
          borderRadius="md"
          border="1px dashed"
          borderColor={useColorModeValue('gray.200', 'whiteAlpha.300')}
          w="full"
          justify="flex-start"
          flexWrap="wrap"
          gap={2}
        >
          <Button size="xs" variant="outline" leftIcon={<Icon as={MdMenu} />} flexShrink={0}>
            {t('chatHistory')}
          </Button>
          <Icon as={MdArrowDownward} color="gray.500" flexShrink={0} />
          <Button
            size="xs"
            variant="ghost"
            border="1px solid"
            borderColor={useColorModeValue('gray.300', 'gray.600')}
            leftIcon={<Icon as={MdFileDownload} />}
            whiteSpace="normal"
            h="auto"
            py={1.5}
            textAlign="left"
          >
            {t('exportChat')} / {t('importChat')}
          </Button>
        </HStack>
      )
    },
    {
      icon: MdVpnKey,
      text: t('guideDesc5'),
      visual: (
        <HStack
          mt={1}
          p={3}
          bg={useColorModeValue('gray.50', 'whiteAlpha.50')}
          borderRadius="md"
          border="1px dashed"
          borderColor={useColorModeValue('gray.200', 'whiteAlpha.300')}
          w="full"
          justify="flex-start"
          flexWrap="wrap"
          gap={2}
        >
          <Button size="xs" variant="outline" leftIcon={<Icon as={MdMenu} />} flexShrink={0}>
            {t('chatHistory')}
          </Button>
          <Icon as={MdArrowDownward} color="gray.500" flexShrink={0} />
          <Button
            size="xs"
            colorScheme="brand"
            leftIcon={<Icon as={MdVpnKey} />}
            whiteSpace="normal"
            h="auto"
            py={1.5}
            textAlign="left"
          >
            {t('providerSettings')}
          </Button>
        </HStack>
      )
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay backdropFilter="blur(3px)" />
      <ModalContent
        border="1px solid"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <ModalHeader>{t('guideTitle')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody py={4}>
          <VStack spacing={6} align="stretch">
            {guides.map((guide, idx) => (
              <HStack key={idx} align="flex-start" spacing={4}>
                <Box
                  p={2}
                  bg={iconBg}
                  color={iconColor}
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Icon as={guide.icon} boxSize={5} />
                </Box>
                <VStack align="flex-start" spacing={2} w="full">
                  <Text fontSize="sm" lineHeight="tall">
                    {guide.text}
                  </Text>
                  {guide.visual && guide.visual}
                </VStack>
              </HStack>
            ))}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="brand" onClick={onClose} w="100%">
            {t('guideGotIt')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
