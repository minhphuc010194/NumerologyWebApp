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
  Flex
} from 'components';
import { useTranslations } from 'next-intl';

export const Footer: FC = () => {
  const t = useTranslations('Footer');
  const { toggleColorMode, colorMode } = useColorMode();
  return (
    <footer>
      <Disclaimer />
      <Wrap justify="center" my={1} align="center">
        <LanguageSwitcher />
        <Tooltip label={t('mode', { mode: colorMode })} hasArrow>
          <Flex
            as="button"
            onClick={toggleColorMode}
            boxSize={10}
            align="center"
            justify="center"
            rounded="full"
            _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.200' } }}
            transition="all 0.2s"
          >
            {colorMode === 'light' ? (
              <Icon as={MoonIcon} boxSize={5} color="gray.600" />
            ) : (
              <Icon as={SunIcon} boxSize={5} color="yellow.400" />
            )}
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
            _hover={{ bg: 'blackAlpha.100', _dark: { bg: 'whiteAlpha.200' } }}
            transition="all 0.2s"
          >
            <Icon as={AiFillGithub} boxSize={5} />
          </Flex>
        </Tooltip>
        <Feeacback />
      </Wrap>
    </footer>
  );
};
