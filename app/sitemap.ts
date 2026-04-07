import { MetadataRoute } from 'next';
import { routing } from '@/src/i18n/routing';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://numerology-app.site';

export default function sitemap(): MetadataRoute.Sitemap {
  // Routes to include in the sitemap
  const routes = ['', '/chat'];

  const sitemapEntries: MetadataRoute.Sitemap = routes.map((route) => {
    // Generate alternates for each supported locale
    const alternates = routing.locales.reduce((acc, locale) => {
      acc[locale] = `${baseUrl}/${locale}${route}`;
      return acc;
    }, {} as Record<string, string>);

    return {
      url: `${baseUrl}/${routing.defaultLocale}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'weekly' : 'daily',
      priority: route === '' ? 1 : 0.8,
      alternates: {
        languages: alternates,
      },
    };
  });

  return sitemapEntries;
}
