"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Flex, Tooltip, useColorModeValue } from "@chakra-ui/react";
import { CustomCard } from "./CustomCard";

export const LanguageSwitcher = ({ isHeader = false }: { isHeader?: boolean }) => {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const hoverBg = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const textColor = useColorModeValue("gray.700", "whiteAlpha.900");

  const switchLocale = () => {
    const nextLocale = locale === "vi" ? "en" : "vi";
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
    router.push(`/${nextLocale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`);
  };

  return (
    <Tooltip label={locale === "vi" ? t("switchLocaleEn") : t("switchLocaleVi")} hasArrow>
      <Flex
        as="button"
        onClick={switchLocale}
        boxSize={10}
        align="center"
        justify="center"
        rounded="full"
        fontSize="xs"
        fontWeight="bold"
        color={textColor}
        _hover={{ bg: hoverBg, color: "brand.700" }}
        transition="all 0.2s"
      >
        {locale === "vi" ? "EN" : "VI"}
      </Flex>
    </Tooltip>
  );
};
