'use client';
import ReactMarkdown from 'react-markdown';
import {
  type FC,
  useId,
  useRef,
  useState,
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo
} from 'react';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useToast } from '@chakra-ui/react';
import {
  Box,
  Input,
  VStack,
  InputDate,
  Button,
  FormControl,
  FormErrorMessage,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@/components';
import { RenderItem } from './RenderItem';
import { useProcessNumerology } from 'hooks';
import dayjs from 'dayjs';

dayjs.extend(customParseFormat);

const NumerologyComponent: FC = () => {
  const tNum = useTranslations('Numerology');
  const tVal = useTranslations('Validation');
  const tMetrics = useTranslations('NumerologyMetrics');
  const router = useRouter();
  const toast = useToast();
  const id = useId();
  const color = useColorModeValue('black', 'white');
  const refInputName = useRef<HTMLInputElement>(null);
  const [localName, setLocalName] = useState<string>('Dương Văn Nghĩa');
  const [localBirth, setLocalBirth] = useState<string>('1976-06-11');
  const [submittedName, setSubmittedName] = useState<string>('Dương Văn Nghĩa');
  const [submittedBirth, setSubmittedBirth] = useState<string>('1976-06-11');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [birthError, setBirthError] = useState<string>('');
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const data = useProcessNumerology(submittedName, submittedBirth);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isMeaningLoading, setIsMeaningLoading] = useState<boolean>(false);
  const [isComingSoon, setIsComingSoon] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatBirthDate = useCallback((birthDate: string): string => {
    if (!birthDate || !birthDate.trim()) {
      return '';
    }

    const parts = birthDate.split('-');
    if (parts.length !== 3) {
      return birthDate;
    }

    const [year, month, date] = parts;
    const paddedYear = year.padStart(4, '0');
    const paddedMonth = month.padStart(2, '0');
    const paddedDate = date.padStart(2, '0');

    return `${paddedYear}-${paddedMonth}-${paddedDate}`;
  }, []);

  const validateBirthDate = useCallback(
    (birthDate: string): string => {
      if (!birthDate || !birthDate.trim()) {
        return tVal('requireBirth');
      }

      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(birthDate)) {
        return tVal('invalidFormat');
      }

      if (!isMounted) {
        return '';
      }

      const date = dayjs(birthDate, 'YYYY-MM-DD', true);
      if (!date.isValid()) {
        return tVal('invalidDate');
      }

      const today = dayjs();
      if (date.isAfter(today)) {
        return tVal('futureDate');
      }

      const minYear = 1900;
      const maxYear = dayjs().year();
      const year = date.year();
      if (year < minYear || year > maxYear) {
        return tVal('yearRange', { min: minYear, max: maxYear });
      }

      return '';
    },
    [isMounted, tVal]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      const formattedBirth = formatBirthDate(localBirth);
      const error = validateBirthDate(formattedBirth);
      if (error) {
        setBirthError(error);
        return;
      }

      setBirthError('');
      setIsLoading(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setSubmittedName(localName.trim());
        setSubmittedBirth(formattedBirth);
      } finally {
        setIsLoading(false);
      }
    },
    [localName, localBirth, formatBirthDate, validateBirthDate]
  );
  const handleMeaningClick = useCallback(async () => {
    setIsMeaningLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsMeaningLoading(false);
    setIsComingSoon(true);
  }, []);
  const contentFormula = useMemo(() => {
    if (!selectedItem?.key) return tNum('formulaComingSoon');
    return tNum(`ExplainFormula.${selectedItem?.key as any}`);
  }, [selectedItem?.key]);
  return (
    <Box>
      <Box as="form" onSubmit={handleSubmit}>
        <VStack spacing={3} align="stretch">
          <Box h="40px">
            <Input
              autoFocus={isMounted}
              rounded={50}
              onClick={() => refInputName.current?.select()}
              ref={refInputName}
              value={localName}
              placeholder={tNum('namePlaceholder')}
              w={{ md: '50%', xs: '100%' }}
              textAlign="center"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setLocalName(e.target.value)
              }
              color={color}
            />
          </Box>

          <FormControl isInvalid={!!birthError}>
            <Box>
              <InputDate
                rounded={50}
                getValue={(date) => {
                  setLocalBirth(date);
                }}
                defaultValue={localBirth}
                color={color}
              />
            </Box>
            {birthError && (
              <FormErrorMessage
                mt={1}
                fontSize="sm"
                textAlign="center"
                justifyContent="center"
              >
                {birthError}
              </FormErrorMessage>
            )}
          </FormControl>

          <Box textAlign="center" py={2}>
            <Button
              type="submit"
              colorScheme="orange"
              size="md"
              w={{ md: '50%', xs: '100%' }}
              borderRadius="full"
              fontSize="md"
              fontWeight={700}
              isLoading={isLoading}
              loadingText={tNum('processing')}
              disabled={isLoading}
              _hover={{
                transform: isLoading ? 'none' : 'translateY(-2px)',
                boxShadow: isLoading ? 'md' : 'lg'
              }}
              _active={{
                transform: 'translateY(0)'
              }}
              _disabled={{
                opacity: 0.6,
                cursor: 'not-allowed'
              }}
              transition="all 0.2s"
            >
              {tNum('viewResult')}
            </Button>
          </Box>
        </VStack>
      </Box>

      <Box mt={4}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={4}
          mb={6}
        >
          <Box
            w={{ base: '40px', md: '80px' }}
            h="1px"
            bgGradient="linear(to-r, transparent, red.500)"
            opacity={0.8}
          />
          <Box
            fontSize={20}
            fontWeight={800}
            color="red.400"
            whiteSpace="nowrap"
          >
            {tNum('indexTitle')}
          </Box>
          <Box
            w={{ base: '40px', md: '80px' }}
            h="1px"
            bgGradient="linear(to-l, transparent, red.500)"
            opacity={0.8}
          />
        </Box>

        <Box display="flex" flexWrap="wrap" justifyContent="center" gap="12px">
          {data.map((item, index: number) => (
            <Box
              key={id + index}
              w={{
                base: 'calc(50% - 6px)',
                sm: 'calc(33.333% - 8px)',
                md: 'calc(25% - 9px)',
                xl: 'calc(20% - 9.6px)'
              }}
            >
              <RenderItem
                item={item}
                onClick={() => {
                  setSelectedItem(item);
                  setIsComingSoon(false);
                  onOpen();
                }}
              />
            </Box>
          ))}
        </Box>

        <Modal
          isOpen={isOpen}
          onClose={onClose}
          isCentered={{ base: false, md: true }}
          motionPreset="slideInBottom"
          size="2xl"
        >
          <ModalOverlay backdropFilter="blur(3px)" />
          <ModalContent mx={4} rounded={20}>
            <ModalHeader>
              {selectedItem
                ? tNum('formulaTitle', {
                    name: tMetrics(selectedItem.key as any)
                  })
                : ''}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Box
                fontSize="sm"
                lineHeight="tall"
                className="formula-markdown"
                css={{
                  '& strong, & b': {
                    color: 'var(--chakra-colors-red-400)',
                    fontWeight: 700
                  },
                  '& ul, & ol': {
                    paddingLeft: '20px',
                    marginBottom: '8px'
                  },
                  '& li': {
                    marginBottom: '6px'
                  },
                  '& p': {
                    marginBottom: '10px'
                  }
                }}
              >
                <ReactMarkdown>{contentFormula}</ReactMarkdown>
              </Box>

              {selectedItem && selectedItem.value !== undefined && (
                <Box mt={6} display="flex" justifyContent="center">
                  <Button
                    colorScheme="orange"
                    borderRadius="full"
                    w="full"
                    px={8}
                    py={{ base: 2, md: 3 }}
                    height="auto"
                    whiteSpace="normal"
                    fontSize={{ base: 'sm', md: 'md' }}
                    lineHeight="shorter"
                    onClick={handleMeaningClick}
                    isLoading={isMeaningLoading}
                    isDisabled={isComingSoon}
                    loadingText={tNum('processing')}
                    _hover={{
                      transform:
                        isMeaningLoading || isComingSoon
                          ? 'none'
                          : 'translateY(-2px)',
                      boxShadow: isMeaningLoading || isComingSoon ? 'md' : 'md'
                    }}
                    transition="all 0.2s"
                  >
                    {isComingSoon
                      ? tNum('featureComingSoon')
                      : tNum('viewMeaning', {
                          metric: tMetrics(selectedItem.key as any),
                          value: selectedItem.value
                        })}
                  </Button>
                </Box>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    </Box>
  );
};

// React 19 compatible component type - workaround for FC type incompatibility
// Using any type to bypass React 19 JSX type strictness
export const Numerology: any = NumerologyComponent;
