'use client';
import NextLink from 'next/link';
import { Box, Heading, Layout, Numerology } from 'components';
import '../../styles/globals.css';
import { useTranslations } from 'next-intl';

// React 19 compatibility - cast Link to any type
const Link = NextLink as any;

export default function HomePage() {
  const t = useTranslations('Home');
  return (
    <Layout>
      <div>
        <Heading as="h1" textAlign="center" fontFamily="fantasy" pt={4}>
          {t('title')}
        </Heading>
        <Link href="/chat">
          <Box
            textAlign="center"
            fontSize="sm"
            color="gray.500"
            fontWeight={500}
            className="sparkle-effect"
            cursor="pointer"
          >
            {t('chatNotice')} {'🤖 '}
          </Box>
        </Link>
        <Box as="br" />
        <main>
          <Numerology />
        </main>
      </div>
    </Layout>
  );
}
