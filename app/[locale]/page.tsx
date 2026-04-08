'use client';
import { useState, useEffect, useCallback } from 'react';
import NextLink from 'next/link';
import Image from 'next/image';
import {
  Box,
  Heading,
  Layout,
  Numerology,
  Text,
  VStack,
  HStack,
  Icon,
  Badge,
  Collapse,
  useColorModeValue,
  MdAutoAwesome,
  MdPlayCircleOutline,
  MdExpandMore,
  MdExpandLess
} from '@/components';
import '@/styles/globals.css';
import { useTranslations, useLocale } from 'next-intl';
import { PyraMascot } from '@/components/Chat/PyraMascot';

const Link = NextLink as any;

const VIDEO_VISIBILITY_KEY = 'numerology-video-visible';

export default function HomePage() {
  const t = useTranslations('Home');
  const locale = useLocale();
  const [isVideoVisible, setIsVideoVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(VIDEO_VISIBILITY_KEY);
    if (stored !== null) {
      setIsVideoVisible(stored === 'true');
    }
    setIsMounted(true);
  }, []);

  const toggleVideoVisibility = useCallback(() => {
    setIsVideoVisible((prev) => {
      const next = !prev;
      localStorage.setItem(VIDEO_VISIBILITY_KEY, String(next));
      return next;
    });
  }, []);

  const heroBg = useColorModeValue(
    'linear(to-br, brand.50, orange.50, yellow.50)',
    'linear(to-br, gray.900, gray.800, brand.900)'
  );
  const heroCardBg = useColorModeValue('whiteAlpha.800', 'whiteAlpha.50');
  const heroCardBorder = useColorModeValue('brand.200', 'brand.700');
  const subtitleColor = useColorModeValue('gray.600', 'gray.400');
  const chatBadgeBg = useColorModeValue('brand.500', 'brand.400');
  const accentGlow = useColorModeValue(
    '0 0 60px rgba(221, 107, 32, 0.15)',
    '0 0 60px rgba(221, 107, 32, 0.1)'
  );
  const dividerColor = useColorModeValue('brand.100', 'brand.800');
  const videoCardBg = useColorModeValue('white', 'gray.800');
  const videoCardBorder = useColorModeValue('gray.200', 'gray.700');
  const videoCaptionColor = useColorModeValue('gray.500', 'gray.400');
  const videoSectionTitleColor = useColorModeValue('gray.700', 'gray.200');

  return (
    <Layout>
      <VStack spacing={0} align="stretch">
        {/* Hero Section */}
        <Box
          bgGradient={heroBg}
          py={{ base: 8, md: 12 }}
          px={{ base: 4, md: 6 }}
          borderRadius={{ base: 'xl', md: '2xl' }}
          mb={6}
          position="relative"
          overflow="hidden"
        >
          {/* Decorative background orbs */}
          <Box
            position="absolute"
            top="-40px"
            right="-40px"
            w="200px"
            h="200px"
            borderRadius="full"
            bg="brand.300"
            opacity={0.08}
            filter="blur(40px)"
          />
          <Box
            position="absolute"
            bottom="-30px"
            left="-30px"
            w="160px"
            h="160px"
            borderRadius="full"
            bg="orange.300"
            opacity={0.08}
            filter="blur(40px)"
          />

          <VStack spacing={5} position="relative" zIndex={1}>
            {/* Logo Mascot */}
            <Link href="/chat" style={{ textDecoration: 'none' }}>
              <Box
                cursor="pointer"
                transition="transform 0.2s"
                _hover={{ transform: 'scale(1.1)' }}
                zIndex={2}
                position="relative"
              >
                <PyraMascot size={{ base: '90px', md: 100 }} state="idle" />
              </Box>
            </Link>

            {/* Title */}
            <Heading
              as="h1"
              textAlign="center"
              fontSize={{ base: '2xl', md: '3xl', lg: '4xl' }}
              fontWeight={800}
              bgGradient="linear(to-r, brand.600, brand.400, orange.400)"
              bgClip="text"
              lineHeight={1.3}
              letterSpacing="tight"
            >
              {t('title')}
            </Heading>

            {/* Subtitle */}
            <Text
              textAlign="center"
              fontSize={{ base: 'sm', md: 'md' }}
              color={subtitleColor}
              maxW="500px"
              lineHeight="tall"
            >
              {t('subtitle')}
            </Text>

            {/* Chat CTA */}
            <Link href="/chat" style={{ textDecoration: 'none' }}>
              <Box
                bg={heroCardBg}
                borderWidth="1px"
                borderColor={heroCardBorder}
                borderRadius="full"
                px={{ base: 3, md: 5 }}
                py={2.5}
                backdropFilter="blur(10px)"
                cursor="pointer"
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  transform: 'translateY(-2px)',
                  shadow: 'lg',
                  borderColor: 'brand.400'
                }}
                _active={{
                  transform: 'translateY(0)'
                }}
              >
                <HStack spacing={{ base: 1.5, md: 2 }}>
                  <Badge
                    bg={chatBadgeBg}
                    color="white"
                    borderRadius="full"
                    px={2}
                    py={0.5}
                    fontSize="2xs"
                    fontWeight={700}
                    textTransform="uppercase"
                    display={{ base: 'none', sm: 'inline-block' }}
                    sx={{
                      animation: 'heroPulse 2s ease-in-out infinite'
                    }}
                  >
                    {t('chatBadgeLabel')}
                  </Badge>
                  <Text
                    fontSize={{ base: '13px', md: 'sm' }}
                    fontWeight={600}
                    color={useColorModeValue('gray.700', 'gray.200')}
                    textAlign="center"
                    whiteSpace={{ base: 'normal', sm: 'nowrap' }}
                  >
                    {t('chatNotice')}
                  </Text>
                  <Icon
                    as={MdAutoAwesome}
                    color="brand.400"
                    boxSize={4}
                    display={{ base: 'none', sm: 'block' }}
                  />
                </HStack>
              </Box>
            </Link>
          </VStack>
        </Box>

        {/* Divider */}
        <Box
          h="1px"
          bgGradient={`linear(to-r, transparent, ${dividerColor}, transparent)`}
          mx="auto"
          w="60%"
          mb={8}
        />

        {/* Video Showcase Section */}
        <VStack spacing={4} mb={8} px={{ base: 2, md: 0 }}>
          {/* Toggle Header */}
          <HStack
            spacing={2}
            cursor="pointer"
            onClick={toggleVideoVisibility}
            role="button"
            aria-expanded={isVideoVisible}
            aria-label={t('videoToggleLabel')}
            px={4}
            py={2}
            borderRadius="full"
            transition="all 0.2s"
            _hover={{
              bg: useColorModeValue('gray.50', 'whiteAlpha.100')
            }}
            userSelect="none"
          >
            <Icon as={MdPlayCircleOutline} color="brand.400" boxSize={5} />
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              fontWeight={700}
              color={videoSectionTitleColor}
            >
              {t('videoTitle')}
            </Text>
            <Icon
              as={isVideoVisible ? MdExpandLess : MdExpandMore}
              color={videoSectionTitleColor}
              boxSize={5}
              transition="transform 0.2s"
            />
          </HStack>

          {/* Collapsible Video Content */}
          {isMounted && (
            <Collapse in={isVideoVisible} animateOpacity>
              <VStack spacing={4} w="100%">
                <Box
                  w="100%"
                  maxW="720px"
                  mx="auto"
                  bg={videoCardBg}
                  borderRadius="xl"
                  overflow="hidden"
                  borderWidth="1px"
                  borderColor={videoCardBorder}
                  shadow="lg"
                  transition="all 0.3s"
                  _hover={{
                    shadow: '2xl',
                    transform: 'translateY(-2px)'
                  }}
                >
                  <Box
                    as="video"
                    w="100%"
                    display="block"
                    controls
                    preload="metadata"
                    playsInline
                    borderRadius="xl"
                    sx={{
                      '&:focus': { outline: 'none' }
                    }}
                  >
                    <source
                      src={`/videos/DecodingNumerology_${locale}.mp4`}
                      type="video/mp4"
                    />
                  </Box>
                </Box>

                <Text
                  fontSize="xs"
                  color={videoCaptionColor}
                  textAlign="center"
                  fontStyle="italic"
                >
                  {t('videoCaption')}
                </Text>
              </VStack>
            </Collapse>
          )}
        </VStack>

        {/* Divider */}
        <Box
          h="1px"
          bgGradient={`linear(to-r, transparent, ${dividerColor}, transparent)`}
          mx="auto"
          w="60%"
          mb={6}
        />

        {/* Main Content */}
        <Box as="main">
          <Numerology />
        </Box>
      </VStack>
    </Layout>
  );
}
