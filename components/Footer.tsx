'use client';
import { FC } from 'react';
import Image from 'next/image';
import {
  Icon,
  Wrap,
  Tooltip,
  Donate,
  Feeacback,
  CustomCard,
  useColorMode,
  AiFillGithub,
  Disclaimer,
  LanguageSwitcher,
  SunIcon,
  MoonIcon,
  Flex,
  Box
} from 'components';
import { useTranslations } from 'next-intl';

export const Footer: FC = () => {
  const t = useTranslations('Footer');
  const { toggleColorMode, colorMode } = useColorMode();
  
  const isLight = colorMode === 'light';
  const bg = isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(26, 32, 44, 0.85)';
  const borderColor = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
  const hoverBg = isLight ? 'blackAlpha.100' : 'whiteAlpha.200';

  return (
    <Box as="footer" pb="120px">
      <Disclaimer />
      
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={100}
        bg={bg}
        backdropFilter="blur(16px)"
        borderTopWidth="1px"
        borderColor={borderColor}
        boxShadow="0 -4px 10px rgba(0, 0, 0, 0.05)"
        pb="env(safe-area-inset-bottom)"
      >
        <Flex 
          justify="center" 
          align="center" 
          py={2} 
          px={4}
          gap={{ base: 2, md: 4 }}
          maxW="container.md"
          mx="auto"
        >
          <LanguageSwitcher />
          
          <Tooltip label={t('mode', { mode: colorMode })} hasArrow>
            <Flex
              as="button"
              onClick={toggleColorMode}
              boxSize={10}
              align="center"
              justify="center"
              rounded="full"
              _hover={{ bg: hoverBg }}
              transition="all 0.2s"
            >
              <Icon 
                as={isLight ? MoonIcon : SunIcon} 
                boxSize={5} 
                color={isLight ? "gray.600" : "yellow.400"} 
              />
            </Flex>
          </Tooltip>
          
          <Donate />
          
          <Tooltip label={t('sourceCode')} hasArrow>
            <Flex
              as="a"
              href="https://github.com/minhphuc010194/NumerologyWebApp"
              target="_blank"
              boxSize={10}
              align="center"
              justify="center"
              rounded="full"
              _hover={{ bg: hoverBg }}
              transition="all 0.2s"
            >
              <Icon as={AiFillGithub} boxSize={5} />
            </Flex>
          </Tooltip>
          
          <Feeacback />
        </Flex>
      </Box>
    </Box>
  );
};
