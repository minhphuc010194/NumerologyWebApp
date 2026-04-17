'use client';
import {
  FC,
  useCallback,
  useState,
  useMemo,
  useRef,
  useEffect,
  RefObject
} from 'react';
import {
  Box,
  Text,
  HStack,
  VStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  useToast,
  Tooltip,
  FaUser,
  FaTrash,
  MdSearch,
  MdClose,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  useDisclosure
} from '@/components';
import { useTranslations } from 'next-intl';
import { type NumerologyProfile } from '@/hooks/useProfiles';
import { useAnalytics } from '@/hooks/useAnalytics';

interface ProfileManagerProps {
  currentName: string;
  currentBirthDate: string;
  profiles: NumerologyProfile[];
  isLoaded: boolean;
  onSelectProfile: (name: string, birthDate: string) => void;
  onDeleteProfile: (profileId: string) => void;
  /** Ref to the name input — used to render the integrated InputGroup */
  nameInputRef?: RefObject<HTMLInputElement>;
  /** Current name value for the input */
  nameValue: string;
  /** Callback when name changes via typing */
  onNameChange: (value: string) => void;
  /** Placeholder text for the name input */
  namePlaceholder?: string;
  /** Color token for input text */
  inputColor?: string;
}

/** Show search bar when profile count exceeds this threshold */
const SEARCH_THRESHOLD = 5;

/** Max visible items in the dropdown before scrolling */
const MAX_DROPDOWN_HEIGHT_PX = 280;

/** Extract initials from a full name (max 2 chars) */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** Format birth date for display: "1976-06-11" → "11/06/1976" */
function formatBirthDateDisplay(birthDate: string): string {
  const parts = birthDate.split('-');
  if (parts.length !== 3) return birthDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/** Deterministic avatar gradient based on name */
function getAvatarGradient(name: string): string {
  const GRADIENTS = [
    'linear(to-br, orange.400, red.400)',
    'linear(to-br, teal.400, blue.400)',
    'linear(to-br, purple.400, pink.400)',
    'linear(to-br, cyan.400, teal.400)',
    'linear(to-br, brand.400, orange.300)',
    'linear(to-br, blue.400, purple.400)',
    'linear(to-br, pink.400, orange.400)',
    'linear(to-br, green.400, teal.400)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

const ProfileManagerComponent: FC<ProfileManagerProps> = ({
  currentName,
  currentBirthDate,
  profiles,
  isLoaded,
  onSelectProfile,
  onDeleteProfile,
  nameInputRef,
  nameValue,
  onNameChange,
  namePlaceholder = '',
  inputColor
}) => {
  const tProfile = useTranslations('Profile');
  const toast = useToast();
  const { trackProfileLoad } = useAnalytics();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // --- Colors ---
  const popoverBg = useColorModeValue('white', 'gray.800');
  const popoverBorder = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const chipBorder = useColorModeValue('gray.100', 'gray.600');
  const chipActiveBg = useColorModeValue('brand.50', 'brand.900');
  const chipActiveBorder = useColorModeValue('brand.400', 'brand.500');
  const chipHoverBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const chipNameColor = useColorModeValue('gray.800', 'white');
  const chipDateColor = useColorModeValue('gray.500', 'gray.400');
  const deleteHoverBg = useColorModeValue('red.50', 'red.900');
  const searchBg = useColorModeValue('gray.50', 'gray.700');
  const searchBorder = useColorModeValue('gray.200', 'gray.600');
  const emptyColor = useColorModeValue('gray.400', 'gray.500');
  const scrollTrackBg = useColorModeValue('gray.100', 'gray.700');
  const scrollThumbBg = useColorModeValue('gray.300', 'gray.500');
  const iconColor = useColorModeValue('brand.400', 'brand.300');
  const iconHoverBg = useColorModeValue('brand.50', 'whiteAlpha.100');
  const badgeBg = useColorModeValue('brand.500', 'brand.400');

  // Clear search when popover closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen && profiles.length > SEARCH_THRESHOLD) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, profiles.length]);

  const isProfileActive = useCallback(
    (profile: NumerologyProfile) => {
      return (
        profile.name.toLowerCase() === currentName.trim().toLowerCase() &&
        profile.birthDate === currentBirthDate
      );
    },
    [currentName, currentBirthDate]
  );

  const handleSelectProfile = useCallback(
    (profile: NumerologyProfile) => {
      trackProfileLoad(profile.name);
      onSelectProfile(profile.name, profile.birthDate);
      onClose();
    },
    [onSelectProfile, trackProfileLoad, onClose]
  );

  const handleDeleteProfile = useCallback(
    (profileId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      setDeletingId(profileId);

      setTimeout(() => {
        onDeleteProfile(profileId);
        setDeletingId(null);
        toast({
          title: tProfile('profileDeleted'),
          status: 'info',
          duration: 2000,
          isClosable: true,
          position: 'top'
        });
      }, 200);
    },
    [onDeleteProfile, toast, tProfile]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  }, []);

  const shouldShowSearch = profiles.length > SEARCH_THRESHOLD;
  const hasProfiles = isLoaded && profiles.length > 0;

  // Sorted profiles: active first, then by creation date
  const sortedProfiles = useMemo(() => {
    return [...profiles].sort((a, b) => {
      const aActive = isProfileActive(a);
      const bActive = isProfileActive(b);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [profiles, isProfileActive]);

  // Filtered profiles based on search query
  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return sortedProfiles;
    const query = searchQuery.toLowerCase().trim();
    return sortedProfiles.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.birthDate.includes(query) ||
        formatBirthDateDisplay(p.birthDate).includes(query)
    );
  }, [sortedProfiles, searchQuery]);

  return (
    <InputGroup size="md">
      {/* Profile icon button — left side of input */}
      <InputLeftElement
        w="44px"
        h="full"
        pointerEvents={hasProfiles ? 'auto' : 'none'}
      >
        <Popover
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
          placement="bottom-start"
          isLazy
          lazyBehavior="unmount"
        >
          <PopoverTrigger>
            <Box position="relative" display="inline-flex">
              <IconButton
                aria-label={tProfile('savedProfiles')}
                icon={<Icon as={FaUser} boxSize={3.5} />}
                variant="ghost"
                size="sm"
                borderRadius="full"
                color={hasProfiles ? iconColor : labelColor}
                opacity={hasProfiles ? 1 : 0.4}
                cursor={hasProfiles ? 'pointer' : 'default'}
                _hover={hasProfiles ? { bg: iconHoverBg } : {}}
                transition="all 0.2s"
              />
              {/* Profile count dot */}
              {hasProfiles && (
                <Box
                  position="absolute"
                  top="-1px"
                  right="-1px"
                  w="16px"
                  h="16px"
                  borderRadius="full"
                  bg={badgeBg}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  pointerEvents="none"
                >
                  <Text
                    fontSize="8px"
                    fontWeight={800}
                    color="white"
                    lineHeight={1}
                  >
                    {profiles.length > 99 ? '99' : profiles.length}
                  </Text>
                </Box>
              )}
            </Box>
          </PopoverTrigger>

          <PopoverContent
            w={{ base: '300px', md: '360px' }}
            bg={popoverBg}
            borderColor={popoverBorder}
            borderRadius="xl"
            shadow="2xl"
            zIndex={20}
            _focus={{ outline: 'none' }}
          >
            <PopoverBody p={0}>
              {/* Header */}
              <HStack
                px={3.5}
                py={2.5}
                borderBottomWidth="1px"
                borderColor={popoverBorder}
              >
                <Icon as={FaUser} color={iconColor} boxSize={3} />
                <Text
                  fontSize="xs"
                  fontWeight={700}
                  color={labelColor}
                  flex={1}
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  {tProfile('savedProfiles')}
                </Text>
                <Text fontSize="2xs" color={labelColor} fontWeight={600}>
                  {profiles.length}
                </Text>
              </HStack>

              {/* Search */}
              {shouldShowSearch && (
                <Box px={3} pt={2.5} pb={1}>
                  <Box position="relative">
                    <Icon
                      as={MdSearch}
                      position="absolute"
                      left={2.5}
                      top="50%"
                      transform="translateY(-50%)"
                      color={labelColor}
                      boxSize={3.5}
                      zIndex={1}
                      pointerEvents="none"
                    />
                    <Input
                      ref={searchInputRef}
                      size="sm"
                      pl={8}
                      pr={searchQuery ? 7 : 3}
                      borderRadius="lg"
                      bg={searchBg}
                      borderColor={searchBorder}
                      fontSize="xs"
                      placeholder={tProfile('searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSearchQuery(e.target.value)
                      }
                      _focus={{
                        borderColor: 'brand.400',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)'
                      }}
                    />
                    {searchQuery && (
                      <IconButton
                        aria-label="Clear search"
                        icon={<Icon as={MdClose} boxSize={3} />}
                        size="xs"
                        variant="ghost"
                        position="absolute"
                        right={0.5}
                        top="50%"
                        transform="translateY(-50%)"
                        borderRadius="full"
                        onClick={handleClearSearch}
                        zIndex={1}
                      />
                    )}
                  </Box>
                </Box>
              )}

              {/* Profile list */}
              <Box
                maxH={`${MAX_DROPDOWN_HEIGHT_PX}px`}
                overflowY="auto"
                overflowX="hidden"
                px={2}
                py={2}
                sx={{
                  '&::-webkit-scrollbar': { width: '4px' },
                  '&::-webkit-scrollbar-track': {
                    bg: scrollTrackBg,
                    borderRadius: 'full'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bg: scrollThumbBg,
                    borderRadius: 'full'
                  },
                  scrollbarWidth: 'thin'
                }}
              >
                <VStack spacing={1} align="stretch">
                  {filteredProfiles.map((profile) => {
                    const isActive = isProfileActive(profile);
                    const isDeleting = deletingId === profile.id;

                    return (
                      <HStack
                        key={profile.id}
                        px={2.5}
                        py={1.5}
                        bg={isActive ? chipActiveBg : 'transparent'}
                        borderWidth="1px"
                        borderColor={
                          isActive ? chipActiveBorder : chipBorder
                        }
                        borderRadius="lg"
                        cursor="pointer"
                        transition="all 0.15s ease"
                        _hover={{
                          bg: isActive ? chipActiveBg : chipHoverBg,
                          borderColor: isActive
                            ? chipActiveBorder
                            : 'brand.300'
                        }}
                        onClick={() => handleSelectProfile(profile)}
                        role="button"
                        aria-label={`${profile.name} - ${profile.birthDate}`}
                        opacity={isDeleting ? 0 : 1}
                        transform={
                          isDeleting ? 'translateX(-10px)' : 'translateX(0)'
                        }
                        spacing={2.5}
                      >
                        {/* Avatar */}
                        <Box
                          w="28px"
                          h="28px"
                          borderRadius="full"
                          bgGradient={getAvatarGradient(profile.name)}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                          shadow="sm"
                        >
                          <Text
                            fontSize="9px"
                            fontWeight={800}
                            color="white"
                            lineHeight={1}
                          >
                            {getInitials(profile.name)}
                          </Text>
                        </Box>

                        {/* Name + Date */}
                        <VStack spacing={0} align="start" flex={1} minW={0}>
                          <Text
                            fontSize="xs"
                            fontWeight={isActive ? 700 : 500}
                            color={chipNameColor}
                            lineHeight="short"
                            noOfLines={1}
                          >
                            {profile.name}
                          </Text>
                          <Text
                            fontSize="2xs"
                            color={chipDateColor}
                            lineHeight="short"
                          >
                            {formatBirthDateDisplay(profile.birthDate)}
                          </Text>
                        </VStack>

                        {/* Active dot */}
                        {isActive && (
                          <Box
                            w="5px"
                            h="5px"
                            borderRadius="full"
                            bg="brand.400"
                            flexShrink={0}
                          />
                        )}

                        {/* Delete */}
                        <Tooltip
                          label={tProfile('deleteProfile')}
                          hasArrow
                          fontSize="xs"
                        >
                          <IconButton
                            aria-label={tProfile('deleteProfile')}
                            icon={<Icon as={FaTrash} boxSize={2.5} />}
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            borderRadius="full"
                            opacity={0}
                            _groupHover={{ opacity: 0.5 }}
                            _hover={{
                              opacity: 1,
                              bg: deleteHoverBg
                            }}
                            transition="all 0.15s"
                            onClick={(e: React.MouseEvent) =>
                              handleDeleteProfile(profile.id, e)
                            }
                            sx={{
                              opacity: 0.3,
                              '&:hover': { opacity: 1 }
                            }}
                          />
                        </Tooltip>
                      </HStack>
                    );
                  })}

                  {/* Empty search */}
                  {filteredProfiles.length === 0 && searchQuery && (
                    <Box py={3} textAlign="center">
                      <Text fontSize="xs" color={emptyColor}>
                        {tProfile('noSearchResults')}
                      </Text>
                    </Box>
                  )}
                </VStack>
              </Box>

              {/* Filter count */}
              {shouldShowSearch &&
                filteredProfiles.length > 0 &&
                searchQuery && (
                  <Text
                    fontSize="2xs"
                    color={emptyColor}
                    textAlign="center"
                    pb={2}
                  >
                    {filteredProfiles.length}/{profiles.length}
                  </Text>
                )}
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </InputLeftElement>

      {/* Name input */}
      <Input
        ref={nameInputRef}
        value={nameValue}
        placeholder={namePlaceholder}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onNameChange(e.target.value)
        }
        onClick={() => nameInputRef?.current?.select()}
        rounded={50}
        pl="44px"
        textAlign="center"
        color={inputColor}
      />
    </InputGroup>
  );
};

export const ProfileManager: any = ProfileManagerComponent;
