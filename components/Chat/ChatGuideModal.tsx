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
  useColorModeValue,
} from '@chakra-ui/react';
import { MdOutlineAutoAwesome, MdOutlineLibraryBooks, MdShield, MdOutlineCloudUpload } from 'react-icons/md';

interface ChatGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => string;
}

export function ChatGuideModal({ isOpen, onClose, t }: ChatGuideModalProps) {
  const iconBg = useColorModeValue('brand.100', 'brand.900');
  const iconColor = useColorModeValue('brand.600', 'brand.200');

  const guides = [
    {
      icon: MdOutlineAutoAwesome,
      text: t('guideDesc1'),
    },
    {
      icon: MdOutlineLibraryBooks,
      text: t('guideDesc2'),
    },
    {
      icon: MdShield,
      text: t('guideDesc3'),
    },
    {
      icon: MdOutlineCloudUpload,
      text: t('guideDesc4'),
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay backdropFilter="blur(3px)" />
      <ModalContent border="1px solid" borderColor={useColorModeValue('gray.200', 'gray.700')}>
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
                <Text fontSize="sm" lineHeight="tall">
                  {guide.text}
                </Text>
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
