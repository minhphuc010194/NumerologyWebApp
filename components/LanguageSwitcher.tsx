"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Flex, Tooltip } from "@chakra-ui/react";
import { CustomCard } from "./CustomCard";

export const LanguageSwitcher = () => {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = () => {
    const nextLocale = locale === "vi" ? "en" : "vi";
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
    router.push(`/${nextLocale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`);
  };

  return (
    <Tooltip label={locale === "vi" ? t("switchLocaleEn") : t("switchLocaleVi")} hasArrow>
      <CustomCard as="button" onClick={switchLocale}>
        <Flex
          boxSize={12}
          border="3px solid"
          rounded="100%"
          align="center"
          justify="center"
          fontSize="lg"
          fontWeight="bold"
          _hover={{ color: "brand.700" }}
          transition="all 0.2s"
        >
          {locale === "vi" ? "EN" : "VI"}
        </Flex>
      </CustomCard>
    </Tooltip>
  );
};
