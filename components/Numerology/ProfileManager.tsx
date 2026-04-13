'use client';
import { FC, useCallback, useState } from 'react';
import {
  Box,
  Text,
  HStack,
  Icon,
  Select,
  IconButton,
  useColorModeValue,
  useToast,
  FaUser,
  FaTrash
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
}

const ProfileManagerComponent: FC<ProfileManagerProps> = ({
  currentName,
  currentBirthDate,
  profiles,
  isLoaded,
  onSelectProfile,
  onDeleteProfile
}) => {
  const tProfile = useTranslations('Profile');
  const toast = useToast();
  const { trackProfileLoad } = useAnalytics();
  const [selectedId, setSelectedId] = useState<string>('');

  // Colors
  const containerBg = useColorModeValue('whiteAlpha.600', 'whiteAlpha.50');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const selectBg = useColorModeValue('white', 'gray.700');
  const labelColor = useColorModeValue('gray.600', 'gray.400');



  const handleSelectProfile = useCallback(
    (profileId: string) => {
      setSelectedId(profileId);
      if (!profileId) return;

      const profile = profiles.find((p) => p.id === profileId);
      if (profile) {
        trackProfileLoad(profile.name);
        onSelectProfile(profile.name, profile.birthDate);
      }
    },
    [profiles, onSelectProfile, trackProfileLoad]
  );

  const handleDeleteProfile = useCallback(
    (profileId: string) => {
      onDeleteProfile(profileId);
      if (selectedId === profileId) {
        setSelectedId('');
      }
      toast({
        title: tProfile('profileDeleted'),
        status: 'info',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
    },
    [onDeleteProfile, selectedId, toast, tProfile]
  );

  if (!isLoaded) return null;

  return (
    <Box
      bg={containerBg}
      backdropFilter="blur(8px)"
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      px={{ base: 3, md: 4 }}
      py={{ base: 2, md: 3 }}
      mb={3}
    >
      <HStack spacing={{ base: 2, md: 3 }} align="center" flexWrap="wrap">
        {/* Label */}
        <HStack spacing={1.5} flexShrink={0}>
          <Icon as={FaUser} color="brand.400" boxSize={3.5} />
          <Text
            fontSize={{ base: 'xs', md: 'sm' }}
            fontWeight={600}
            color={labelColor}
            whiteSpace="nowrap"
          >
            {tProfile('savedProfiles')}
          </Text>
        </HStack>

        {/* Select dropdown */}
        <Box flex={1} minW="120px">
          <Select
            size="sm"
            value={selectedId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              handleSelectProfile(e.target.value)
            }
            placeholder={tProfile('selectProfile')}
            borderRadius="lg"
            bg={selectBg}
            fontSize="xs"
          >
            {profiles.map((profile: NumerologyProfile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name} ({profile.birthDate})
              </option>
            ))}
          </Select>
        </Box>

        {/* Delete selected profile */}
        {selectedId && (
          <IconButton
            aria-label={tProfile('deleteProfile')}
            icon={<Icon as={FaTrash} />}
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={() => handleDeleteProfile(selectedId)}
            borderRadius="lg"
          />
        )}
      </HStack>
    </Box>
  );
};

export const ProfileManager: any = ProfileManagerComponent;
